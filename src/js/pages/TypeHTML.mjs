import startCase from 'lodash.startcase'
import { today } from '../../grafbase/dates.mjs'
import { singular } from 'pluralize'
import { v4 as uuid } from 'uuid'
import dayjs from 'dayjs'

const labelCase = (label) => {
  if (label === 'dob') return startCase('date of birth')
  if (label === 'card')
    return 'Card <small>(autofills Name, DOB, Email, Mobile)</small>'
  return startCase(label)
}

class TypeHTML {
  constructor(type, types, enums) {
    this.type = type
    this.typeName = type.name
    this.types = types
    this.enums = enums
    this.fields = {}
    this.hasCollections = false
    this.#fields()
    this.#htmlTemplates()
    // console.log('TypeHTML', this)
  }

  static DefaultImage =
    'https://res.cloudinary.com/andystevenson/image/upload/e_blur:100,o_20,c_fill,f_auto,g_face:center,q_auto/v1691413940/roa/alumni-template.avif'

  static DefaultThumbnail =
    'https://res.cloudinary.com/andystevenson/image/upload/e_blur:100,o_20,c_fill,f_auto,g_face:center,h_250,q_auto,w_250/v1691413940/roa/alumni-template.avif'

  // private functions

  #fields() {
    this.type.fields.forEach((field) => {
      this.fields[field.name] = field
      if (field.collection) this.hasCollections = true
    })
  }

  #htmlEnum(field) {
    const { type, name, defaultValue } = field
    const bareType = type.replace('!', '')
    const Enum = this.enums[bareType]
    const defaultEnum = defaultValue ? defaultValue.value : null
    const options = Enum.fields
      .map((field) => field.name)
      .map((option) => {
        const selected = defaultEnum === option ? 'selected' : ''

        const friendly = labelCase(option)
        return `<option value="${option}" ${selected}>${friendly}</option>`
      })
      .join('')

    const id = `"${this.typeName}-${name}"`
    const fId = `id=${id}`
    const fFor = `for=${id}`
    const fLabel = `<span>${labelCase(name)}</span>`
    const select = `<label ${fFor}>${fLabel}<select ${fId} name="${name}">${options}</select></label>`
    field.html = select
  }

  #htmlMinMaxStep(field) {
    // TODO: as much client side validation as possible
    const { type, length } = field
    const bareType = type.replace('!', '')
    let fStep = bareType === 'Float' ? 'step="0.01"' : ''

    if (!length) return fStep

    const { min, max } = length
    let fMin = min ? `min="${min}"` : ''
    let fMax = max ? `max="${max}"` : ''
    let attributes = [fMin, fMax, fStep]
      .filter((attribute) => attribute)
      .join(' ')
    return attributes
  }

  #htmlInputPattern(field) {
    // TODO: as much client side validation as possible
    return ''
  }

  #htmlInputValue(field) {
    // does not deal with enums!
    const { type, defaultValue, system } = field
    const bareType = type.replace('!', '')

    // use the default value if provided
    if (defaultValue) {
      return `value="${defaultValue.value}"`
    }

    // special case for Date/Time
    const isDate = bareType === 'Date'
    if (isDate) {
      const dateValue = `${today.format('YYYY-MM-DD')}`
      return `value="${dateValue}"`
    }

    const isTime = bareType === 'DateTime'
    if (isTime && !system) {
      const timeValue = `${today.format('HH:mm')}`
      return `value="${timeValue}"`
    }

    return ''
  }

  #htmlTextArea(field) {
    const { name } = field
    const fLabel = labelCase(name)
    const id = `"${this.typeName}-${name}"`
    const fId = `id=${id}`
    const fFor = `for=${id}`
    const isClass = `class="${this.typeName}-${name}"`
    const fName = `name="${name}"`
    const fValue = this.#htmlInputValue(field)
    const fTitle = `title="Please provide a useful ${name}..."`
    const fPlaceholder = `placeholder="Please provide a useful ${name}..."`
    const fMinMaxStep = this.#htmlMinMaxStep(field)
    const textarea = `<textarea ${fId} ${isClass} ${fName} ${fTitle} ${fPlaceholder} ${fMinMaxStep} rows="5">${fValue}</textarea>`
    field.html = `<label ${fFor}><span>${fLabel}</span>${textarea}</label>`
  }

  #htmlInputType(field) {
    const { type, builtin } = field
    if (!builtin) return null
    const bareType = type.replace('!', '')
    if (bareType === 'ID') return 'text'
    if (bareType === 'String') return 'text'
    if (bareType === 'Float') return 'number'
    if (bareType === 'Int') return 'number'
    if (bareType === 'Boolean') return 'text'
    if (bareType === 'Date') return 'date'
    if (bareType === 'DateTime') return 'time' // TODO: maybe datetime-local?!?
    if (bareType === 'Email') return 'email'
    if (bareType === 'IPAddress') return 'text'
    if (bareType === 'Timestamp') return 'number'
    if (bareType === 'URL') return 'text'
    if (bareType === 'JSON') return 'text' // TODO: ???
    if (bareType === 'PhoneNumber') return 'text'
    return null
  }

  #htmlSystemField(field) {
    const { name } = field
    const fId = `id="${this.typeName}-${name}"`
    const fValue = this.#htmlInputValue(field)

    if (name === 'id') {
      field.html = `<input ${fId} name="${name}" type="hidden" data-system=true data-type="ID" readonly tabindex="-1" ${fValue} >`
    }

    if (name === 'createdAt') {
      const attributes = `${fId} name="${name}" type="text" data-system=true data-type="DateTime" tabindex="-1" readonly ${fValue}`
      field.html = `<div><span class="bicp">&#xF7DB;</span><input ${attributes}></div>`
    }

    if (name === 'updatedAt') {
      const attributes = `${fId} name="${name}" type="text" data-system=true data-type="DateTime" tabindex="-1" readonly ${fValue}`
      field.html = `<div><input ${attributes}><span class="bicp">&#xF13A;</span></div>`
    }
  }

  #htmlDefaultImg(field) {
    const { name } = field
    if (name === 'image') return TypeHTML.DefaultImage
    if (name === 'thumbnail') return TypeHTML.DefaultThumbnail
    return ''
  }

  #htmlImg(field) {
    const { name } = field
    const fClass = `class="${this.typeName}-${name} image"`
    const fId = `id="${this.typeName}-${name}"`
    const def = this.#htmlDefaultImg(field)
    field.html = `<button type="button" title="click to update" ${fId} ${fClass}>
                    <img src="${def}" alt="${name}" width="300" height="600">
                    <div><span class="bicp">&#xF4FA;</span><span>${name}</span></div>
                    <span class="error-message"></span>
                    <input type="file" accept="image/*" name="file" hidden>
                    <input type="hidden" name="${name}" value="${def}">
                  </button>`
  }

  #htmlPlaceholder(field) {
    const { name } = field
    let text = null
    if (name === 'name') text = 'Please enter full name...'
    if (name === 'email') text = 'e.g: someone@example.com'
    if (name === 'mobile') text = 'e.g: 07911123456'
    if (name === 'card') text = 'WWSC membership card number, e.g: 001234'
    if (text) return `placeholder="${text}"`
    return null
  }

  #htmlField(field) {
    const {
      name,
      type,
      builtin,
      system,
      length,
      nullable,
      collection,
      isenum,
    } = field
    if (system) return this.#htmlSystemField(field)
    if (collection) return this.#htmlCollection(field)
    if (isenum) return this.#htmlEnum(field)
    if (!builtin) return

    const bareType = type.replace('!', '')
    const isImage = name === 'image' || name === 'thumbnail'
    if (bareType === 'String' && length) return this.#htmlTextArea(field)
    if (bareType === 'URL' && isImage) return this.#htmlImg(field)

    const id = `${this.typeName}-${name}`
    const isClass = `class="${id}"`
    const fFor = `for="${id}"`
    const fTitle = labelCase(name)
    const fId = `id="${id}"`
    const fName = `name="${name}"`
    const fType = `type="${this.#htmlInputType(field)}"`
    const fPattern = this.#htmlInputPattern(field)
    const fMinMaxStep = this.#htmlMinMaxStep(field)
    const fDataType = `data-type="${type}"`
    const required = nullable ? '' : 'required'
    const fValue = this.#htmlInputValue(field)
    const placeholder = this.#htmlPlaceholder(field)
    const uuid = name === 'booking' ? 'data-uuid=true' : ''
    const attributes = [
      fId,
      isClass,
      fName,
      fType,
      fPattern,
      fMinMaxStep,
      fDataType,
      placeholder,
      required,
      uuid,
      fValue,
    ]
      .filter((attribute) => attribute)
      .join(' ')
    field.html = `<label ${fFor}><span>${fTitle}</span><input ${attributes}></label>`
  }

  #htmlCollection(field) {
    const { name } = field
    const one = singular(name)
    const id = `${this.typeName}-${name}`
    const isClass = `class="${id} dialog-details"`
    const fField = `data-type=${this.typeName} data-field=${name}`
    const add = `<button type="button" class="add-to-collection" title="add ${one}"><span class="bicp">&#xF4FA;</span></button>`
    const content = `<section class="details-content"></section>${add}`

    const details = `<details ${isClass} ${fField}><summary>${name}</summary>${content}</details>`
    field.html = details
  }

  #htmlTemplates() {
    this.type.fields.forEach((field) => this.#htmlField(field))
  }

  from(element) {
    const { id, name } = element
    const fields = Object.keys(element)
      .map((field) => {
        const value = element[field]
        const isNull = value === null
        if (field === 'name') {
          if (isNull) return `<h3 data-name="${field}"></h3>`
          return `<h3 data-name="${field}" title="click to update">${value}</h3>`
        }

        if (field === 'mobile') {
          if (isNull) return `<a data-name="${field}"></a>`
          return `<a data-name="${field}" href="tel:${value}" title="click to call">${value}</a>`
        }

        if (field === 'email') {
          if (isNull) return `<a data-name="${field}"></a>`
          return `<a data-name="${field}" href="mailto:${value}" title="click to email">${value}</a>`
        }

        if (field === 'psa') {
          if (isNull) return `<a data-name="${field}"></a>`
          return `<a data-name="${field}" href="${value}" target="_blank"><img src="https://d2h2jicm4ii9y.cloudfront.net/wp-content/uploads/2023/01/PSA-2.png"></a>`
        }

        if (field === 'image' || field === 'thumbnail') {
          return `<button type="button" data-name="${field}"><img  src="${value}" alt="${field} of ${name}"></button>`
        }

        if (field === 'dob') {
          if (isNull) return `<span data-name="${field}"></span>`
          return `<span data-name="${field}">${value}</span>`
        }

        if (field === 'bio' || field === 'description') {
          if (isNull) {
            return `<details><summary>${field}</summary><p data-name="${field}"></p></details>`
          }
          return `<details><summary>${field}</summary><p data-name="${field}">${value}</p></details>`
        }
        if (isNull) return `<span data-name="${field}"></span>`
        return `<span data-name="${field}">${value}</span>`
      })
      .join('')

    const attributes = `id="${id}" class="${this.typeName}-element element"`
    const article = `<article ${attributes}>${fields}</article>`
    return article
  }

  dialog() {
    console.log('htmlDialog', this.type)
    if (this.type.typedef === 'enum') return null

    if (this.type.dialog) return this.type.dialog

    const elements = this.type.fields
      .filter((field) => !field.collection)
      .filter((field) => field.html)
      .map((field) => field.html)
      .join('')

    const collectionsHTML = this.type.fields
      .filter((field) => field.collection)
      .filter((field) => field.html)
      .map((field) => field.html)
      .join('')

    const collections = `<section class="${this.typeName}-collections dialog-collections">${collectionsHTML}</section>`
    const p = `<p>${this.typeName}</p>`
    const close = `<button type="button" id="close-dialog"><span class="bicp">&#xF623;</span></button>`
    const header = `<header>${p}${close}</header>`
    const cancel = `<button type="button" id="cancel-action"><span class="bicp">&#xF623;</span><span>cancel</span></button>`
    const deleteMe = `<button type="button" id="delete-action"><span class="bicp">&#xF78B;</span><span>delete</span></button>`
    const submit = `<button type="submit" id="submit-action"><span class="bicp">&#xF4FA;</span><span>submit</span></button>`
    const footer = `<footer>${cancel}${deleteMe}${submit}</footer>`
    const action = `<input type="hidden" name="action" value="create">`
    const typeField = `<input type="hidden" name="type" value="${this.typeName}">`
    const contents = `${action}${typeField}${elements}`
    const inputs = `<section class="${this.typeName}-inputs dialog-inputs">${contents}</section>`
    const form = `<form>${header}${inputs}${collections}${footer}</form>`

    this.type.dialog = `<dialog class="dialog" id="${this.typeName}-dialog">${form}</dialog>`
    return this.type.dialog
  }

  #nth(element) {
    let nth = ''
    let e = element.closest('[data-nth]')
    while (e) {
      const n = e.dataset.nth
      nth = nth ? `${n}:${nth}` : `${n}`
      e = e.parentElement.closest('[data-nth]')
    }
    return nth
  }

  details(collection, content, from) {
    const one = singular(collection)
    const fields = this.type.fields
      .filter((field) => field.html)
      .map((field) => field.html)
      .join('')
    const summary = `<summary>${one}</summary>`
    const deleteMe = `<button type="button" class="delete-from-collection" title="delete ${one}"><span class="bicp">&#xF78B;</span></button>`
    const markAsFetched = from ? 'data-fetched=true' : ''
    const fId = from ? `id="${from.id}"` : ''

    const nth = content.children.length

    const inner = `${summary}<fieldset class="element-details-content">${fields}</fieldset>${deleteMe}`
    const details = `<details ${fId} class="${this.typeName}-details element-details" ${markAsFetched} data-type=${this.typeName} open>${inner}</details>`
    content.insertAdjacentHTML('afterbegin', details)
    const newDetails = content.firstElementChild
    const parentDetails = newDetails.parentElement.parentElement
    newDetails.dataset.nth = nth
    newDetails.dataset.pid = parentDetails.dataset.parent
      ? parentDetails.dataset.parent
      : ''
    newDetails.dataset.ptype = parentDetails.dataset.type
    newDetails.dataset.pfield = parentDetails.dataset.field
    newDetails.dataset.pnth = parentDetails.dataset.nth
      ? parentDetails.dataset.nth
      : 0
    this.#updateIds(newDetails, from)
  }

  #updateIds(element, from) {
    let nth = this.#nth(element)
    console.log('updateIds', { nth })
    const inputs = Array.from(element.querySelectorAll('input,textarea,select'))
    inputs.forEach((input) => {
      const label = input.closest('label')
      const { name } = input

      const prefix = from ? `ignore-${from.id}` : this.typeName
      const id = `${prefix}-${nth}-${name}`
      input.id = id
      input.name = id
      // special case for automatically generating uuids
      if (input.dataset.uuid) input.value = uuid()
      if (label) label.htmlFor = id

      if (from && name in from) {
        let value = from[name]
        if (input.type === 'time') {
          const date = dayjs(value)
          console.log('updateIds', name, value, date.format('HH:mm'))
          value = date.format('HH:mm')
        }
        input.value = value
      }
    })
  }
}

export default TypeHTML
