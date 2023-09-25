import GrafbaseSchema from './GrafbaseSchema.mjs'
import TypeActions from './TypeActions.mjs'
import EventEmitter from 'node:events'

class GrafbaseClient {
  constructor(schema) {
    this.schema = schema
    this.modelTypes = this.schema.types.filter((type) => type.model)
    this.actions = {}
    this.emitter = new EventEmitter({ captureRejections: true })
    this.#init()
  }

  #init() {
    this.#populate()
  }

  #populate() {
    // populate the this.actions by creating the required functions
    this.modelTypes.forEach(
      (type) =>
        (this.actions[type.name] = new TypeActions(
          type,
          this.schema,
          this.actions,
          this.emitter,
        )),
    )
  }

  async invoke(request) {
    const { action, type } = request
    if (!action || !type) return null

    const Type = this.actions[type]
    if (!Type) return null

    const result = await Type[action](request)
    // console.log('invoke', result)
    return result
  }

  async dbclean() {
    // a dangerous function
    // essentially goes through every type and deletes them from the database!
    // an essential tool for testing!
    for (const type in this.actions) {
      const action = this.actions[type]
      await action.clean()
    }
  }

  // check if the db is empty
  async dbIsEmpty() {
    let empty = true
    for (const type in this.actions) {
      const action = this.actions[type]
      const ids = action.ids()
      if (ids.length > 0) {
        empty = false
        break
      }
    }
    return empty
  }
}

const client = new GrafbaseClient(GrafbaseSchema)
export default client
