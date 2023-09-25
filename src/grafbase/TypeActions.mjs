import camelCase from 'lodash.camelcase'
import { stripIndent } from 'common-tags'
import graphql from './graphql.mjs'
import { inspect } from './utilities.mjs'

class TypeActions {
  constructor(type, schema, actions, emitter) {
    this.type = type
    this.schema = schema
    this.actions = actions
    this.emitter = emitter
    this.name = type.name
    this.typename = camelCase(type.name)
    this.idprefix = this.typename.toLowerCase()
    this.collectionName = this.typename + 'Collection'
    this.fields = type.fields.reduce((fields, field) => {
      fields[field.name] = field
      return fields
    }, {})
    this.collections = type.fields.filter((field) => field.collection)
    this.collectionActions = {}
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

      // generate an action function
      this[name] = async function (request) {
        const typedef = collection
        const element = this.actions[typedef.element]
        let response = { id: request.id }
        let r = request[name] // the case for multiple collections update
        if (!r) r = request // the case for single collection update
        const subactions = {
          list: r.list,
          ids: r.ids,
          deleteAll: r.deleteAll,
          create: r.create,
          update: r.update,
          delete: r.delete,
        }
        const n = Object.values(subactions).reduce((count, subaction) => {
          if (subaction) count = count + 1
          return count
        }, 0)
        if (n === 0) subactions.list = []

        if (subactions.list) {
          // list is a singleton action
          const list = await this.list({ id: request.id, select: [name] })
          response = list[name]
          this.#emit({ name, request, response, type: this })
          return response
        }

        if (subactions.ids) {
          // list is a singleton action
          const select = { id: request.id, select: [{ [name]: ['id'] }] }
          const ids = await this.ids(select)
          response = ids[name]
          this.#emit({ name, request, response, type: this })

          return response
        }

        if (subactions.deleteAll) {
          // delete all is a singleton request
          // list all the objects, make a request to delete them
          const { id } = request
          const idsRequest = { id, ids: [] }
          const ids = await this[name](idsRequest)

          // transform the ids into a delete request

          const deleteMany = await element.deleteMany(ids)

          response = deleteMany
          this.#emit({ name, request, response, type: this })

          return response
        }

        if (subactions.create) {
          // create maybe followed in the same request but update && delete
          // therefore it is not a singleton request
          const { id } = request

          // the objects in the create request... don't yet know their parent.active
          // if we do populate the object so they understand what parent to link to
          if (id) {
            subactions.create.forEach((newObject) => {
              newObject.id = id
              newObject.type = this.name
            })
          }

          const createMany = await element.createMany(subactions.create)
          response.create = createMany
        }

        if (subactions.update) {
          // update is not a singleton response. it may be done with create && delete
          const updateMany = await element.updateMany(subactions.update)
          response.update = updateMany
        }

        if (subactions.delete) {
          // delete is not a singleton action, it may be preceeded by create && update
          const deleteMany = await element.deleteMany(subactions.delete)
          response.delete = deleteMany
        }

        if (element.hasCollections()) {
          for (const action in element.collectionActions) {
            // check to see if any actions from the elements are also being requested
            if (action in r) {
              // may select from these ids if supplied as part of the request

              // otherwise we need to get all the ids to build up the request
              const idsRequest = {
                id: request.id,
                action: request.action,
                type: request.type,
                [name]: { ids: [] },
              }

              let ids = await this[name](idsRequest)

              // set up the response
              for (const id of ids) {
                const iResponse = { id }
                const iRequest = {
                  id,
                  type: element.name,
                  action,
                  [action]: r[action],
                }
                const eResponse = await element[action](iRequest)
                iResponse[action] = eResponse
                response[request.type][name].push(iResponse)
              }
            }
          }
        }

        this.#emit({ name, request, response, type: this })

        return response
      }
      this.collectionActions[name] = this[name]
    })
  }

  // utilities
  #read(request = {}) {
    const { id, name } = request
    if (id) return `by: {id: "${id}"}`
    if (name) return `by: {name: "${name}"}`
  }

  #delete(id) {
    return this.#read({ id })
  }

  #updateValue(value, field) {
    const { type, builtin, isenum } = field

    if (isenum) return value
    if (!builtin) return `{link: "${value}"}`
    if (type === 'Boolean' || type === 'Boolean!') return value
    if (type === 'Float' || type === 'Float!') return `{set: ${+value}}`
    if (type === 'Int' || type === 'Int!') return `{set: ${+value}}`
    return value === null ? null : `"${value}"`
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
    return value === null ? null : `"${value}"`
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
    // console.log('#createMany', request)
    let requests = request.map((r) => `{${this.#input(r)}}`)
    return { count: requests.length, input: `input: [${requests}]` }
  }

  #updateMany(request) {
    // console.log('#updateMany', request)

    let requests = request.map((r) => `{${this.#update(r)}}`).join('')

    return { count: requests.length, input: `input: [${requests}]` }
  }

  #deleteMany(ids) {
    // ids can be just simple [id] or [{id: ...}]
    const requests = ids.map((id) => {
      const deleteId = id.id ? id.id : id
      return `{${this.#delete(deleteId)}}`
    })
    return { count: requests.length, input: `input: [${requests}]`, ids }
  }

  #isSimpleCreateAction(request) {
    return request.create && Object.keys(request).length === 1
  }

  #isDeleteAllAction(request) {
    return request.deleteAll && Object.keys(request).length === 1
  }

  async #collections(request, parent) {
    for (const action in this.collectionActions) {
      if (action in request) {
        if (parent && request[action].create) {
          request[action].create.forEach((object) => {
            object.id = parent.id
            object.type = this.name
          })
        }
        const run = this.collectionActions[action].bind(this)
        const response = await run(request)
        // annotate the response with collection responses
        if (parent) {
          if (this.#isSimpleCreateAction(request[action])) {
            parent[action] = response.create
            continue
          }

          // the response may be multiples
          parent[action] = response
        }
      }
    }
  }

  // actions

  hasCollections() {
    return this.collections.length > 0
  }

  async #listCollection() {
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

  async #listCollectionField(field) {
    return this.#listCollectionFields(field.split(' '))
  }

  #legitFields(fields) {
    const result = fields.reduce((list, field) => {
      const argType = typeof field

      if (argType === 'string') {
        // this might be a list of fields space separated
        const fieldList = field.split(' ')
        if (fieldList.length > 1) {
          return `${list} ${this.#legitFields(fieldList)}`.trim()
        }

        // okay we now have a single field to test
        const candidate = fieldList[0]
        const legit = this.fields[candidate]

        // if it is not a legit field skip it
        if (!legit) return list

        // if the field is a collection fetch its default response fields
        const { collection, element, reference } = legit
        if (collection) {
          const actions = this.actions[element]
          const names = actions.responseFieldsNames
          const cField = stripIndent`${field}(first: 100) {
                                edges { node { ${names}  }}
                              }`
          return `${list} ${cField}`.trim()
        }

        // if it is not a builtin type && not nullable it is a reference to another object
        if (reference) {
          return `${list} ${field} { id }`.trim()
        }
        // just a plain field
        return `${list} ${candidate}`.trim()
      }

      if (argType === 'object') {
        // has the form {field: [innerField...], field: [innerField...]}
        const object = field
        for (const property in object) {
          const legit = this.fields[property]
          // just skip it if it is not legit
          if (!legit) continue

          const oFields = object[property]
          const { collection, element, bareType, reference } = legit
          if (collection) {
            const actions = this.actions[element]
            let legitFields = actions.#legitFields(oFields)
            legitFields ||= 'id'
            const cField = stripIndent`${property}(first: 100) {
                                          edges { node { ${legitFields} }}
                                        }`
            list = `${list} ${cField}`.trim()
          }

          // if it is not a builtin type && not nullable it is a reference to another object

          if (reference) {
            const actions = this.actions[bareType]
            let legitFields = actions.#legitFields(oFields)
            legitFields ||= 'id'
            list = `${list} ${property} { ${legitFields} }`.trim()
          }
        }
        return list
      }
    }, '')

    // console.log('legit=', result)
    return result || 'id'
  }

  async #listCollectionFields(fields) {
    // console.log('#legitFields', this.#legitFields(fields))
    const legitFields = this.#legitFields(fields)

    const query = stripIndent`
    query ${this.name}List {
      ${this.collectionName}(first: 100) {
        edges {
          node {
            ${legitFields}
          }
        }
      }
    }`
    let result = await graphql(query)
    const response = result

    this.#emit({ name: `list`, request: fields, response, type: this })

    return result
  }

  async #listFromObject(request) {
    const read = this.#read(request)
    const { select } = request
    const legitFields = this.#legitFields(select)
    const query = stripIndent`
    query ${this.name} {
      ${this.typename}(${read}) {
        ${legitFields}
      }
    }`

    let result = await graphql(query)
    const response = result

    this.#emit({ name: `list`, request, response, type: this })

    return result
  }

  async list(from) {
    // from?: property | collection
    //        [property | collection | {collection {[property | collection | collection{}]}}] |

    // simple case of list everything
    if (!from) return this.#listCollection()

    // determine how to process based on arguments
    const argsType = typeof from

    if (argsType === 'string') {
      return this.#listCollectionField(from)
    }

    if (Array.isArray(from)) {
      return this.#listCollectionFields(from)
    }

    if (argsType === 'object') {
      if (from.id) {
        if (from.select) {
          // selecting a subset of fields
          return this.#listFromObject(from)
        }

        // return the default object
        return this.read(from)
      }
    }

    // List everything
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

  async exists(request) {
    const { name } = request
    const read = this.#read(request)
    const query = stripIndent`
    query ${this.name} {
      ${this.typename}(${read}) {
        id
        ${name ? 'name' : ''}
      }
    }`

    let result = await graphql(query)
    const response = result

    this.#emit({ name: `exists`, request, response, type: this })

    return result
  }

  async create(request) {
    const input = this.#input(request)

    const mutation = stripIndent`
    mutation ${this.name}Create {
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

    if (this.hasCollections()) {
      let i = 0
      for (const object of result) {
        const update = { action: 'update', type: this.name, id: object.id }
        for (const action in this.collectionActions) {
          if (action in request[i]) {
            update[action] = request[i][action]
          }
        }
        // console.log('createMany to as updates? %s %o`', this.name, update)
        await this.#collections(update, result[i])
        i = i + 1
      }
    }

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
    mutation ${this.name}Update {
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
    // if it is a complex object do simple individual updates
    if (this.hasCollections()) {
      let response = []
      for (const object of request) {
        const result = await this.update(object)
        response.push(result)
      }
      this.#emit({ name: `updateMany`, request, response, type: this })

      return response
    }

    // a simple object
    const { count, input } = this.#updateMany(request)
    if (!count) {
      const response = []
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

    let result = await graphql(mutation)
    const response = result
    this.#emit({ name: `updateMany`, request, response, type: this })

    return result
  }

  #deleteAllRequest(from) {
    const { id } = from
    const request = { id }
    return this.collections.reduce((fullRequest, collection) => {
      const { name } = collection
      fullRequest[name] = { deleteAll: true }
      return fullRequest
    }, request)
  }

  async delete(request) {
    const { id } = request

    // delete all the collections if there are any
    let deletes = null
    if (this.hasCollections()) {
      deletes = {}
      await this.#collections(this.#deleteAllRequest(request), deletes)
    }

    const mutation = stripIndent`
    mutation ${this.name}Delete {
      ${this.typename}Delete(${this.#delete(id)}) {
        deletedId
      }
    }`

    let deleted = await graphql(mutation)

    const response = deletes ? { deleted, ...deletes } : deleted
    this.#emit({ name: `delete`, request, response, type: this })

    return response
  }

  async deleteMany(request) {
    const { count, input, ids } = this.#deleteMany(request)
    if (!count) {
      const response = []
      return response
    }

    let deletes = ids.map((id) => ({ id: id.id ? id.id : id }))
    if (this.hasCollections()) {
      let i = 0
      for (const id of ids) {
        const deleteAll = this.#deleteAllRequest({ id })
        await this.#collections(deleteAll, deletes[i])
        i = i + 1
      }
    }

    const mutation = stripIndent`
    mutation ${this.name}DeleteMany {
      ${this.typename}DeleteMany(${input}) {
          deletedIds
      }
    }`

    await graphql(mutation)

    const response = deletes
    deletes = this.#deleteIds(deletes)
    this.#emit({ name: `deleteMany`, request, response, type: this })

    return deletes
  }

  #deleteIds(deletes) {
    return deletes.map((d) => {
      const n = Object.keys(d).length
      if (n === 1) return d.id
      return d
    })
  }

  #mapCollectionIds(ids) {
    for (const collection in ids) {
      ids[collection] = ids[collection].map((cid) => cid.id)
    }
  }

  async ids(from) {
    // from can be a null | undefined, collection-name, [collection-name], {id, [collection-name]}

    if (!from) {
      let ids = await this.list('id')
      return ids.map((object) => object.id)
    }

    const argType = typeof from

    if (argType === 'string') {
      // we're selecting a collection-name
      const collection = from
      if (this.collectionActions[collection]) {
        // we have a legitimate collection
        let ids = await this.list([{ [collection]: ['id'] }])
        return ids.map((object) => {
          object[collection] = object[collection].map((cid) => cid.id)
          return object
        })
        // not a legitimate collection name so just return an empty []
        return []
      }
    }

    if (argType === 'object' && from.id) {
      // we're selecting the ids from the objects collections
      let { id, select } = from

      if (select) {
        // this case covers selecting only a subset of collections
        let ids = await this.list(from)
        this.#mapCollectionIds(ids)
        return ids
      }

      // generate a select for all collection
      select ||= {
        id,
        select: this.collections.map((collection) => ({
          [collection.name]: ['id'],
        })),
      }
      let ids = await this.list(select)
      this.#mapCollectionIds(ids)
      return ids
    }
    return []
  }

  async clean() {
    const ids = await this.ids()
    const deleted = await this.deleteMany(ids)
  }
}

export default TypeActions
