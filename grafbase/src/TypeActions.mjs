import camelCase from 'lodash.camelcase'
import { stripIndent } from 'common-tags'
import graphql from './graphql.mjs'

class TypeActions {
  constructor(type, actions) {
    this.type = type
    this.actions = actions
    this.name = type.name
    this.typename = camelCase(type.name)
    this.idprefix = this.typename.toLowerCase()
    this.collectionName = this.typename + 'Collection'
    this.collections = type.fields.filter((field) => field.collection)
    this.collectionActions = []
    this.responseFields = type.fields
      .filter((field) => !field.collection && field.builtin)
      .map((field) => field.name)
    this.inputFields = type.fields.filter(
      (field) => !(field.system || field.collection),
    )
    this.responseFieldsNames = this.responseFields.join(' ')
    this.#addCollectionActions()
  }

  // private functions
  #addCollectionActions() {
    this.collections.forEach((collection) => {
      const { name } = collection
      this[name] = async function (request) {
        const typedef = collection
        const element = this.actions[typedef.element]

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
          return list[name]
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
          return ids[name].map((id) => id.id)
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
          ids.forEach((id) => (deleteRequest[`delete.${id}`] = 'delete me'))
          const deleteMany = await element.deleteMany(deleteRequest)
          return deleteMany
        }

        const createMany = await element.createMany(request)
        const updateMany = await element.updateMany(request)
        const deleteMany = await element.deleteMany(request)
        return { createMany, updateMany, deleteMany }
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

    if (!builtin) return `{link: "${value}"}`
    if (isenum) return value
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
      if (property.startsWith(`${this.typename}.`)) {
        const [typename, nth, fieldname] = property.split('.')
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
      if (property.startsWith(`update.${this.idprefix}_`)) {
        const [_, id, fieldname] = property.split('.')
        if (!(id in requests)) requests[id] = {}
        requests[id][fieldname] = request[property]
      }
    }

    const { id, type } = request
    // if there was an originator of this request, keep them in the forwarded request
    requests = Object.values(requests).map((request) => ({
      id,
      type,
      ...request,
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
      if (property.startsWith(`delete.${this.idprefix}`)) {
        const [_, id] = property.split('.')
        requests.push({ id })
      }
    }

    requests = requests.map((request) => `{${this.#delete(request)}}`)
    return { count: requests.length, input: `input: [${requests}]` }
  }

  #collections(request, parent) {
    this.collectionActions.forEach((action) => {
      const collectionRequest = structuredClone(request)
      collectionRequest.id = parent.id
      const run = action.bind(this)
      run(collectionRequest)
    })
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
    this.#collections(request, created)
    return created
  }

  async createMany(request) {
    const { count, input } = this.#createMany(request)
    if (!count) return {}

    const mutation = stripIndent`
    mutation ${this.name}CreateMany {
      ${this.typename}CreateMany(${input}) {
        ${this.collectionName} {
          ${this.responseFieldsNames}
        }
      }
    }`

    let result = await graphql(mutation)
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
    this.#collections(request, updated)
    return updated
  }

  async updateMany(request) {
    const { count, input } = this.#updateMany(request)
    if (!count) return {}

    const mutation = stripIndent`
    mutation ${this.name}UpdateMany {
      ${this.typename}UpdateMany(${input}) {
        ${this.collectionName} {
          ${this.responseFieldsNames}
        }
      }
    }`
    let result = await graphql(mutation)
    return result
  }

  async delete(request) {
    const mutation = stripIndent`
    mutation ${this.name}Delete {
      ${this.typename}Delete(${this.#delete(request)}) {
        deletedId
      }
    }`
    // TODO: delete any collections
    this.#collections({ ...request, subaction: 'delete' }, { ...request })
    let deleted = await graphql(mutation)
    return deleted
  }

  async deleteMany(request) {
    const { count, input } = this.#deleteMany(request)
    if (!count) return {}
    const mutation = stripIndent`
    mutation ${this.name}DeleteMany {
      ${this.typename}DeleteMany(${input}) {
          deletedIds
      }
    }`
    // TODO: what about their dependents?
    let result = await graphql(mutation)
    return result
  }
}

export default TypeActions
