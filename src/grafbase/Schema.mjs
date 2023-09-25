// parse a grafbase graphql scheam
class Schema {
  constructor(schema) {
    this.rawTypes = Schema.fromRaw(schema)
    this.types = []
    this.enums = []
    this.relations = null
    this.parse()
    this.#enums()
    this.#relations()
    // inspect(this.types)
  }

  static FieldTypes = [
    'ID',
    'String',
    'Int',
    'Float',
    'Boolean',
    'Date',
    'DateTime',
    'Email',
    'IPAddress',
    'Timestamp',
    'URL',
    'JSON',
    'PhoneNumber',
  ]

  static Builtins = {
    types: Schema.FieldTypes,
    collections: Schema.FieldTypes.map((type) => `[${type}]`),
    is(type, orCollection = false) {
      const nType = type.replace(/!/g, '')
      const builtin = orCollection
        ? this.types.includes(nType) || this.collections.includes(nType)
        : this.types.includes(nType)
      return builtin
    },
  }

  static InternalFields = [
    {
      name: 'id',
      type: 'ID',
      builtin: true,
      system: true,
    },
    {
      name: 'createdAt',
      type: 'DateTime',
      builtin: true,
      system: true,
    },
    {
      name: 'updatedAt',
      type: 'DateTime',
      builtin: true,
      system: true,
    },
  ]

  static SchemaParse = /^.+{[\s\S]*?}/gm
  static ParseType = /^(.+){([\s\S]*?)}/
  static ParseField = /^((\S+):\s+(\S+)\s*?(.*))|(.+)$/
  static ParseDefault = /^default\s*\(\s*value:\s*(.*)\)$/
  static ParseFloat = /^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/
  static ParseInteger = /^[-+]?\d+$/
  static ParseBoolean = /^true|false$/
  static ParseWord = /^\w+$/
  static ParseString = /(['"])(.*?)\1/g
  static ParseLength =
    /^length\(min:\s+(\d+),\s+max:\s+(\d+)\s*\)|\(max:\s+(\d+),\s+min:\s+(\d+)\s*\)|\(min:\s+(\d+),?\)|\(max:\s+(\d+)\)$/

  static ParseCollectionType = /^\[(.*?)\]/

  static fromRaw(schema) {
    return schema
      .match(Schema.SchemaParse)
      .map((type) => type.match(Schema.ParseType).slice(1, 3))
  }

  static parseTypedef(raw) {
    const [typedef, name, ...directives] = raw.replace(/\s+/g, ' ').split(' ')

    if (typedef === 'enum') return { typedef, name }

    const model = directives.includes('@model')
    const search = directives.includes('@search')
    return { typedef, name, model, search }
  }

  static parseDefault(raw) {
    const [value] = raw.match(Schema.ParseDefault).slice(1)

    if (Schema.ParseBoolean.test(value))
      return { value: value === 'true', type: 'Boolean' }

    if (Schema.ParseInteger.test(value)) return { value: +value, type: 'Int' }

    if (Schema.ParseWord.test(value)) return { value, type: 'enum' }

    if (Schema.ParseString.test(value)) {
      const result = { value: value.slice(1, -1), type: 'String' }
      return result
    }

    if (Schema.ParseFloat.test(value)) {
      return { value: +value, type: 'Float' }
    }

    return null
  }

  static parseLength(raw) {
    // I am sure there is a better regex but I could not work it out!
    const [min, max, maxFirst, minSecond, justMin, justMax] = raw
      .match(Schema.ParseLength)
      .slice(1)

    if (min && max) return { min: +min, max: +max }
    if (maxFirst && minSecond) return { min: +minSecond, max: +maxFirst }
    if (justMin) return { min: +justMin }
    if (justMax) return { max: +justMax }
    return null
  }

  static parseDirectives(raw) {
    if (!raw) return {}
    // console.log('parseDirectives', { raw })
    return raw
      .trim()
      .split('@')
      .reduce((directives, directive) => {
        if (directive.startsWith('unique'))
          return { ...directives, unique: true }

        if (directive.startsWith('default')) {
          return { ...directives, defaultValue: Schema.parseDefault(directive) }
        }

        if (directive.startsWith('length')) {
          return { ...directives, length: Schema.parseLength(directive) }
        }
      }, {})
  }

  static parseFields(raw) {
    return {
      fields: raw
        .split('\n')
        .map((field) => field.trim())
        .map((field) => {
          const parts = field.match(Schema.ParseField)
          const last = parts.length - 1
          if (parts[last]) {
            // we have a simple value from an enum
            return { name: parts[last], type: 'enum-value' }
          }
          const [name, type, directives] = parts.slice(2)
          const collection = type.startsWith('[') && type.includes(']')
          const nullable = !type.endsWith('!') && !collection
          const builtin = Schema.Builtins.is(type)
          let element = type.match(Schema.ParseCollectionType)
          if (element) element = element[1]

          return {
            name,
            type,
            bareType: type.replace('!', ''),
            nullable,
            collection,
            builtin,
            element,
            reference: !collection && !nullable && !builtin,
            ...Schema.parseDirectives(directives),
          }
        }),
    }
  }

  #enums() {
    this.enums = this.types.filter((type) => type.typedef === 'enum')
    this.types
      .filter((type) => type.typedef === 'type')
      .forEach((type) => {
        type.fields.forEach((field) => {
          if (this.enum(field.type)) {
            field.isenum = true
          }
        })
      })
  }

  enum(name) {
    return this.enums.find((type) => type.name === name)
  }

  type(name) {
    return this.types.find((type) => type.name === name)
  }

  fieldOfType(typeName, fieldType) {
    const type = this.type(typeName)
    const field = type?.fields.find(
      (field) => field.element === fieldType || field.bareType === fieldType,
    )
    return field
  }

  #relations() {
    this.types.forEach((type) => {
      const { typedef } = type
      if (typedef === 'enum') return
      type.fields.forEach((field) => {
        const { bareType, collection, element, builtin, isenum, system } = field

        const ignore = builtin || isenum || system

        if (ignore) return

        const fType = collection
          ? this.fieldOfType(element, type.name)
          : this.fieldOfType(bareType, type.name)

        if (fType) {
          if (collection && fType.collection) field.relation = 'many-to-many'
          if (collection && !fType.collection) field.relation = 'one-to-many'
          if (!collection && fType.collection) field.relation = 'many-to-one'
          if (!collection && !fType.collection) field.relation = 'one-to-one'
          return
          // it is a simple link relation
        }
        field.relation = 'link'
      })
    })

    const relations = this.types
      .filter((type) => type.fields.find((field) => field.relation))
      .map((type) => {
        const { name } = type
        const relations = type.fields
          .filter((field) => field.relation)
          .map((field) => {
            const { name, bareType, collection, element, relation } = field
            const type = collection ? element : bareType
            return { name, type, relation }
          })
        return { name, relations }
      })
      .map((relative) => {
        let { name, relations } = relative
        let all = relations.reduce((object, next) => {
          let { name: fieldName, type, relation } = next
          object[name] ??= {}
          object[name][fieldName] = { type, relation }
          return object
        }, {})
        return all
      })
    this.relations = relations
  }

  parse() {
    // converts raw types into types
    const trimmed = this.trim()
    this.types = trimmed.map(({ type, fields }) => {
      const base = {
        ...Schema.parseTypedef(type),
        ...Schema.parseFields(fields),
      }
      if (base.typedef === 'type') {
        const internals = structuredClone(Schema.InternalFields)
        base.fields = internals.concat(base.fields)
      }
      return base
    })
  }

  trim() {
    // trim needless whitespace within the this.rawTypes
    return this.rawTypes.map(([type, fields]) => ({
      type: type.trim(),
      fields: fields.trim(),
    }))
  }
}

export default Schema
