import camelCase from 'lodash.camelcase'
import { stripIndent } from 'common-tags'
import graphql from './graphql.mjs'

class TypeActions {
  constructor(type, actions, emitter) {
    this.type = type
    this.actions = actions
    this.emitter = emitter
    this.name = type.name
    this.typename = camelCase(type.name)
    this.idprefix = this.typename.toLowerCase()
    this.collectionName = this.typename + 'Collection'
    this.collections = type.fields.filter((field) => field.collection)
    this.collectionActions = []
    this.responseFields = type.fields
      .filter((field) => !field.collection && (field.builtin || field.isenum))
      .map((field) => field.name)
    this.inputFields = type.fields.filter(
      (field) => !(field.system || field.collection),
    )
    this.responseFieldsNames = this.responseFields.join(' ')
    this.#addCollectionActions()
  }

  // private functions

  #emit(object) {
    this.emitter.emit(`${this.name}.${object.name}`, object)
  }

  #addCollectionActions() {
    this.collections.forEach((collection) => {
      const { name } = collection
      this[name] = async function (request) {
        const typedef = collection
        const element = this.actions[typedef.element]

        console.log('collectionAction', request)
        if (request.subaction === 'list') {
          const query = stripIndent`
          query ${this.name}${name} {
            ${this.typename}(${this.#read(request)}) {
              ${name}(first: 100) {
                edges {
                  node {
                    ${element.responseFieldsNames}
                  }
                }
              }
            }
          }`
          const list = await graphql(query)
          const response = list[name]

          this.#emit({ name, request, response, type: this })

          return response
        }

        if (request.subaction === 'ids') {
          const query = stripIndent`
          query ${this.name}${name} {
            ${this.typename}(${this.#read(request)}) {
              ${name}(first: 100) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }`

          // await & return
          const ids = await graphql(query)
          const response = ids[name].map((id) => id.id)

          this.#emit({ name, request, response, type: this })

          return response
        }

        if (request.subaction === 'delete') {
          // list all the objects
          // make a request to delete them
          const idsRequest = {
            ...request,
            subaction: 'ids',
          }
          const ids = await this[name](idsRequest)
          // transform the ids into a delete request
          const deleteRequest = { ...idsRequest }
          ids.forEach((id) => (deleteRequest[`delete-${id}`] = 'delete me'))
          console.log(`${this.name} subaction.delete`, deleteRequest)
          const deleteMany = await element.deleteMany(deleteRequest)
          const response = deleteMany

          this.#emit({ name, request, response, type: this })

          return deleteMany
        }

        const createMany = await element.createMany(request)
        const updateMany = await element.updateMany(request)
        const deleteMany = await element.deleteMany(request)
        const response = { createMany, updateMany, deleteMany }

        this.#emit({ name, request, response, type: this })

        return response
      }
      this.collectionActions.push(this[name])
    })
  }

  // utilities
  #read(request = {}) {
    const id = request.id
    return `by: {id: "${id}"}`
  }

  #delete(request = {}) {
    return this.#read(request)
  }

  #updateValue(value, field) {
    const { type, builtin, isenum } = field

    if (isenum) return value
    if (!builtin) return `{link: "${value}"}`
    if (type === 'Boolean' || type === 'Boolean!') return value
    if (type === 'Float' || type === 'Float!') return `{set: ${+value}}`
    if (type === 'Int' || type === 'Int!') return `{set: ${+value}}`
    return `"${value}"`
  }

  #update(request = {}) {
    // gather the inputs from the request
    // id is required for an update
    const id = request.id

    const values = this.inputFields.reduce((inputs, field) => {
      const { name } = field

      if (name in request) {
        let value = request[name]

        inputs.push([name, this.#updateValue(value, field)])
      }
      return inputs
    }, [])

    const input = `input: {${values.map(
      ([name, value]) => `${name}: ${value}`,
    )}}`

    return `by: {id: "${id}"}, ${input}`
  }

  #inputValue(value, field) {
    const { type, builtin, isenum } = field

    if (isenum) return value
    if (!builtin) return `{link: "${value}"}`
    if (type === 'Boolean' || type === 'Boolean!') return value
    if (type === 'Float' || type === 'Float!') return +value
    if (type === 'Int' || type === 'Int!') return +value
    return `"${value}"`
  }

  #input(request = {}) {
    // gather the inputs from the request
    const { type } = request
    const values = this.inputFields.reduce((inputs, field) => {
      const { name, nullable } = field

      if (name in request) {
        let value = request[name]
        inputs.push([name, this.#inputValue(value, field)])
        return inputs
      }

      // missing input
      if (!nullable) {
        if (`${type}!` === field.type) {
          // we have a relation link to parent... fill it in!
          const { id } = request
          if (id) {
            inputs.push([name, this.#inputValue(id, field)])
          }
        }
      }
      return inputs
    }, [])
    return `input: {${values.map(([name, value]) => `${name}: ${value}`)}}`
  }

  #createMany(request) {
    // from within the request we are looking for properties with the signature
    // [typename].[\d+].fieldname
    // these are then gathered up and put into individual inputs

    // gather all the inputs of the correct type
    let requests = []

    for (const property in request) {
      if (property.startsWith(`${this.name}-`)) {
        const [typename, nth, fieldname] = property.split('-')
        requests.length = +nth + 1
        if (!requests[+nth]) requests[+nth] = {}
        requests[+nth][fieldname] = request[property]
      }
    }

    const { id, type } = request
    // if there was an originator of this request, keep them in the forwarded request
    requests = requests.map((request) => ({
      id,
      type,
      ...request,
    }))
    requests = requests.map((request) => `{${this.#input(request)}}`)
    return { count: requests.length, input: `input: [${requests}]` }
  }

  #updateMany(request) {
    // from within the request we are looking for properties with the signature
    // update.id.fieldname
    // these are then gathered up and put into individual inputs

    // gather all the inputs of the correct type
    let requests = {}

    for (const property in request) {
      if (property.startsWith(`update-${this.idprefix}_`)) {
        const [_, id, fieldname] = property.split('-')
        if (!(id in requests)) requests[id] = {}
        requests[id][fieldname] = request[property]
      }
    }

    // console.log('#updateMany', request, requests)

    requests = Object.keys(requests).map((id) => ({
      id,
      ...requests[id],
    }))

    requests = Object.values(requests).map(
      (request) => `{${this.#update(request)}}`,
    )

    return { count: requests.length, input: `input: [${requests}]` }
  }

  #deleteMany(request) {
    // from within the request we are looking for properties with the signature
    // delete.typename_
    // these are then gathered up and put into individual inputs

    let requests = []

    for (const property in request) {
      if (property.startsWith(`delete-${this.idprefix}`)) {
        const [_, id] = property.split('-')
        requests.push({ id })
      }
    }

    requests = requests.map((request) => `{${this.#delete(request)}}`)
    return { count: requests.length, input: `input: [${requests}]` }
  }

  async #collections(request, parent) {
    for (const action of this.collectionActions) {
      const collectionRequest = structuredClone(request)
      collectionRequest.id = parent.id
      const run = action.bind(this)
      await run(collectionRequest)
    }
  }

  // actions
  async list() {
    const query = stripIndent`
    query ${this.name}List {
      ${this.collectionName}(first: 100) {
        edges {
          node {
            ${this.responseFieldsNames}
          }
        }
      }
    }`

    let result = await graphql(query)
    const response = result

    this.#emit({ name: `list`, request: {}, response, type: this })

    return result
  }

  async create(request) {
    const input = this.#input(request)

    const mutation = stripIndent`
    mutation Create${this.name} {
      ${this.typename}Create(${input}) {
        ${this.typename} {
          ${this.responseFieldsNames}
        }
      }
    }`

    let created = await graphql(mutation)
    await this.#collections(request, created)

    const response = created
    this.#emit({ name: `create`, request, response, type: this })

    return created
  }

  async createMany(request) {
    const { count, input } = this.#createMany(request)
    if (!count) {
      const response = []
      this.#emit({ name: `createMany`, request, response, type: this })

      return response
    }

    const mutation = stripIndent`
    mutation ${this.name}CreateMany {
      ${this.typename}CreateMany(${input}) {
        ${this.collectionName} {
          ${this.responseFieldsNames}
        }
      }
    }`

    let result = await graphql(mutation)

    const response = result
    this.#emit({ name: `createMany`, request, response, type: this })

    return result
  }

  async read(request) {
    const read = this.#read(request)
    const query = stripIndent`
    query ${this.name} {
      ${this.typename}(${read}) {
        ${this.responseFieldsNames}
      }
    }`

    let result = await graphql(query)
    const response = result

    this.#emit({ name: `read`, request, response, type: this })

    return result
  }

  async update(request) {
    const update = this.#update(request)

    const mutation = stripIndent`
    mutation Update${this.name} {
      ${this.typename}Update(${update}) {
        ${this.typename} {
          ${this.responseFieldsNames}
        }
      }
    }`

    let updated = await graphql(mutation)
    await this.#collections(request, updated)

    const response = updated
    this.#emit({ name: `update`, request, response, type: this })

    return updated
  }

  async updateMany(request) {
    const { count, input } = this.#updateMany(request)
    if (!count) {
      const response = []
      this.#emit({ name: `updateMany`, request, response, type: this })
      return response
    }

    const mutation = stripIndent`
    mutation ${this.name}UpdateMany {
      ${this.typename}UpdateMany(${input}) {
        ${this.collectionName} {
          ${this.responseFieldsNames}
        }
      }
    }`

    // console.log('updateMany', { mutation })
    let result = await graphql(mutation)
    const response = result

    this.#emit({ name: `updateMany`, request, response, type: this })

    return result
  }

  async delete(request) {
    const mutation = stripIndent`
    mutation ${this.name}Delete {
      ${this.typename}Delete(${this.#delete(request)}) {
        deletedId
      }
    }`

    await this.#collections({ ...request, subaction: 'delete' }, { ...request })
    console.log('delete', mutation)

    let deleted = await graphql(mutation)

    const response = deleted
    this.#emit({ name: `delete`, request, response, type: this })

    return deleted
  }

  async deleteMany(request) {
    const { count, input } = this.#deleteMany(request)
    if (!count) {
      const response = []
      this.#emit({ name: `deleteMany`, request, response, type: this })
      return response
    }

    const mutation = stripIndent`
    mutation ${this.name}DeleteMany {
      ${this.typename}DeleteMany(${input}) {
          deletedIds
      }
    }`

    console.log('deleteMany', mutation)

    let result = await graphql(mutation)

    const response = result
    this.#emit({ name: `deleteMany`, request, response, type: this })

    return result
  }
}

export default TypeActions
