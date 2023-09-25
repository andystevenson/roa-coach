import schema from '../../../grafbase/schema.graphql?raw'
import Schema from '../../grafbase/Schema.mjs'
import TypeHTML from './TypeHTML.mjs'
import { ordinalDateTime, today } from '../../grafbase/dates.mjs'
import { apiFetch } from './utilities.mjs'
import { offline } from './network-status.mjs'
import { Page } from './page-info.mjs'

const API = '/api/roa'

class PageController {
  constructor(typeName) {
    this.schema = new Schema(schema)
    this.type = null
    this.typeName = typeName
    this.types = {}
    this.enums = {}
    this.fields = {}
    this.htmls = {}
    this.html = null
    this.create = document.getElementById('create')
    this.dialogs = document.getElementById('dialogs')
    this.search = document.getElementById('search')
    this.listview = document.getElementById('list-view')
    this.personview = document.getElementById('person-view')
    this.elements = document.getElementById('elements')
    this.errorDialog = document.getElementById('error-dialog')
    this.closeErrorDialog = document.getElementById('close-error-dialog')
    this.errorMessage = document.getElementById('error-message')
    this.exitErrorDialog = document.getElementById('exit-error-dialog')
    this.#types()
    this.#enums()
    this.#fields()
    this.#htmls()
    this.#addEventListeners()
    console.log('PageController', this)
  }

  // private functions
  #types() {
    this.schema.types.forEach((type) => {
      this.types[type.name] = type
    })
    this.type = this.types[this.typeName]
  }

  #enums() {
    this.schema.enums.forEach((type) => {
      this.enums[type.name] = type
    })
  }

  #fields() {
    this.type.fields.forEach((field) => (this.fields[field.name] = field))
  }

  #htmls() {
    this.schema.types.forEach((type) => {
      this.htmls[type.name] = new TypeHTML(type, this.types, this.enums)
    })
    this.html = this.htmls[this.typeName]
  }

  #addModalEventListeners(dialog, mode) {
    const close = document.getElementById('close-dialog')
    close.addEventListener('click', this.close.bind(this))

    const cancel = document.getElementById('cancel-action')
    cancel.addEventListener('click', this.cancel.bind(this))

    const deleteMe = document.getElementById('delete-action')
    deleteMe.addEventListener('click', this.delete.bind(this))

    const submit = document.getElementById('submit-action')
    submit.addEventListener('click', this.submit.bind(this))

    const details = dialog.querySelectorAll('.dialog-details')

    details.forEach((detail) => {
      mode === 'update'
        ? detail.addEventListener('toggle', this.#detailsUpdate.bind(this))
        : detail.addEventListener('toggle', this.#detailsCreate.bind(this))
    })

    const collections = Array.from(
      dialog.querySelectorAll('.add-to-collection'),
    )

    collections.forEach((add) =>
      add.addEventListener('click', this.addToCollection.bind(this)),
    )
  }

  async #detailsCreate(e) {
    const details = e.target
    const open = details.open
    const field = details.dataset.field
    console.log('detailsCreate', this.#isCreate(), field, open)
  }

  #form() {
    const forms = document.forms
    if (document.forms.length > 1) console.warn('multiple forms!!!', forms)
    return forms[0]
  }

  #formElements(names) {
    const form = this.#form()
    const elements = names
      .map((name) => [name, form.elements[name].value])
      .reduce((all, [name, value]) => {
        all[name] = value
        return all
      }, {})

    return elements
  }

  async #detailsUpdate(e) {
    const details = e.target
    const summary = details.querySelector('summary')
    const field = details.dataset.field
    const open = details.open
    const content = details.querySelector('.details-content')

    try {
      // only action read request on open
      if (open) {
        // const data = this.formData(details)
        let { id, type } = this.#formElements(['id', 'type'])

        const fieldType = this.fields[field]
        const element = fieldType.element
        const html = this.htmls[element]

        const request = { id, action: field, type, subaction: 'list' }
        const response = await apiFetch(API, request)

        console.log(`${this.typeName}.${field} fetched ${response.length}`)
        response.forEach((object) => {
          html.details(field, content, object)
          const added = content.firstElementChild
          summary.innerHTML = `${field}<sup>(${content.children.length})</sup>`
          this.#addToEventListeners(added, object)
        })
        return
      }

      if (!open) {
        // we need to purge read data and re-fetch on open because it may have been remotely changed
        const wereFetched = Array.from(
          content.querySelectorAll('[data-fetched]'),
        )
        console.log(
          `${this.typeName}.${field} wereFetched ${wereFetched.length}`,
        )
        wereFetched.forEach((fetched) => fetched.remove())
        return
      }
    } catch (error) {
      console.log(`#detailsUpdate error`, error)
      this.error(error)
    }
  }

  #showModal(e, mode) {
    this.dialogs.innerHTML = ''
    this.dialogs.innerHTML = this.html.dialog()
    const dialog = this.dialogs.firstElementChild
    this.#addModalEventListeners(dialog, mode)
    dialog.showModal()
    // hack to test update modals
    // dialog.classList.add('update')
  }

  #addEventListeners() {
    window.addEventListener('load', this.fetch.bind(this))

    this.create.addEventListener('click', this.#showModal.bind(this))

    this.search.addEventListener('input', this.filter.bind(this))

    this.listview.addEventListener('click', () => {
      this.elements.classList.add('listview')
    })

    this.personview.addEventListener('click', () => {
      this.elements.classList.remove('listview')
    })

    this.closeErrorDialog.addEventListener('click', this.close.bind(this))
    this.exitErrorDialog.addEventListener('click', this.close.bind(this))
  }

  #correctDateTimeValues(request, form) {
    const times = Array.from(form.querySelectorAll('input[type="time"]'))
    times.forEach((time) => {
      const { name, value } = time
      if (!(name in request)) return

      const [hour, minute] = value.split(':')
      const newTime = today.hour(+hour).minute(+minute).toISOString()
      request[name] = newTime
      console.log('#correctDateTimeValues', name, value, newTime, request[name])
    })
    return request
  }

  #stripEmptyFields(formData) {
    // TODO: hmmm, not sure this shouldn't be field validated for nullable etc
    let dataEntries = formData.entries()
    let entries = Array.from(dataEntries)

    entries
      .filter(([_, value]) => !value)
      .forEach(([name]) => formData.delete(name))

    // strip anything that starts with ignore
    console.log('#strip pre', Object.fromEntries(formData.entries()))
    dataEntries = formData.entries()
    entries = Array.from(dataEntries)
    entries
      .filter(([name]) => name.startsWith('ignore-'))
      .forEach(([name]) => formData.delete(name))

    console.log('#strip post', Object.fromEntries(formData.entries()))

    const request = Object.fromEntries(formData.entries())

    return request
  }

  #fill(form, article, from) {
    //  fill in the modal form with data from
    const { id } = from
    form.dataset.parent = id
    const keys = Object.keys(from)
    keys.forEach((key) => {
      const value = from[key]
      const dKey = form.querySelector(`[name="${key}"]`)
      const aKey = article.querySelector(`[data-name="${key}"]`)
      if (key === 'createdAt' || key === 'updatedAt') {
        dKey.value = ordinalDateTime(value)
        return
      }

      if (key === 'image' || key === 'thumbnail') {
        const aImg = aKey.firstElementChild
        aImg.src = value

        dKey.value = value
        const dImg = dKey.closest('button').firstElementChild
        dImg.src = value
        return
      }

      if (key === 'mobile') {
        aKey.href = `tel:${value}`
        aKey.textContent = value
        dKey.value = value
        return
      }

      if (key === 'email') {
        aKey.href = `mailto:${value}`
        aKey.textContent = value
        dKey.value = value
        return
      }

      if (key === 'psa') {
        aKey.href = value
        aKey.innerHTML = `<img src="https://d2h2jicm4ii9y.cloudfront.net/wp-content/uploads/2023/01/PSA-2.png">`
        dKey.value = value
        return
      }

      aKey.textContent = value
      dKey.value = value
    })
  }

  async update(e) {
    const article = e.target.closest('article')
    try {
      // make a read request for the element being updated
      const request = { id: article.id, type: this.typeName, action: 'read' }
      const response = await apiFetch(API, request)

      const mode = 'update'
      this.#showModal(e, mode)
      const form = this.dialogs.firstElementChild.querySelector('form')

      const action = form.querySelector('[name="action"]')
      action.value = mode

      const dialog = form.closest('dialog')
      dialog.classList.add(mode)

      this.#fill(form, article, response)
      const { id } = response
      const details = Array.from(form.querySelectorAll('details'))
      details.forEach((detail) => (detail.dataset.parent = id))
    } catch (error) {
      console.log('read error', error)
    }
  }

  #elementEventListeners(element) {
    // element is a HTMLElement!
    const article = element
    const name = element.querySelector('[data-name="name"]')
    const image = element.querySelector('[data-name="image"]')
    const thumbnail = element.querySelector('[data-name="thumbnail"]')
    name?.addEventListener('click', this.update.bind(this))
    image?.addEventListener('click', this.update.bind(this))
    thumbnail?.addEventListener('click', this.update.bind(this))
  }

  append(element) {
    const html = this.html.from(element)
    this.elements.insertAdjacentHTML('afterbegin', html)
    const added = this.elements.firstElementChild
    this.#elementEventListeners(added)
    added.scrollIntoView({ behavior: 'smooth' })
  }

  load(elements) {
    console.log('loading', elements)
    this.elements.innerHTML = elements
      .map((element) => this.html.from(element))
      .join('')

    Array.from(this.elements.children).forEach((element) =>
      this.#elementEventListeners(element),
    )
  }

  // method
  async cloudinary(request, form) {
    // upload the image into cloudinary
    const imageButton = form.querySelector('button.image')

    const updated = imageButton.dataset.updated

    if (!updated) {
      console.log('image did not update')
      // nothing to upload to cloudinary
      return null
    }

    request.page = Page
    const uploaded = await apiFetch('/api/cloudinary-upload', request)
    delete request.page
    request.image = uploaded.portrait
    request.thumbnail = uploaded.thumbnail
    return uploaded
  }

  async fetch() {
    // fetch the current list of elements of (this.type)
    console.log('fetching data...')
    const request = { action: 'list', type: this.typeName }
    try {
      const response = await apiFetch(API, request)
      console.log('fetch', { request, response })
      this.load(response)
    } catch (error) {
      console.error(`${this.typeName} fetch failed`, error)
      this.error(error)
    }
  }

  formData(element) {
    const form = element.closest('form')
    console.log('formData', this.#form(), form)
    const data = new FormData(form)
    // strip system attributes from any request
    data.delete('createdAt')
    data.delete('updatedAt')
    // strip file input from request as it relates to internal image reader
    data.delete('file')
    let request = this.#stripEmptyFields(data)
    request = this.#correctDateTimeValues(request, form)
    return request
  }

  close(e) {
    const closeButton = e.target.closest('button')
    const dialog = closeButton.closest('dialog')
    console.log('in close', { closeButton, dialog })
    dialog.close()
  }

  cancel(e) {
    this.close(e)
  }

  async delete(e) {
    console.log(`delete called`, e.target, this)
    const deleteButton = e.target.closest('button')
    const form = deleteButton.closest('form')
    const id = form.querySelector('[name="id"]').value
    const request = { action: 'delete', type: this.typeName, id }
    if (!id) return

    try {
      const response = await apiFetch(API, request)
      const article = document.getElementById(id)
      article?.remove()
      console.log('delete', { response })
      this.close(e)
    } catch (error) {
      this.error(error)
    }
  }

  #isCreate() {
    const form = this.#form()
    return form.querySelector('[name="action"]').value === 'create'
  }

  #isUpdate() {
    const form = this.#form()
    return form.querySelector('[name="action"]').value === 'update'
  }

  async submit(e) {
    e.preventDefault()
    console.log(`submit called`, e.target, this)
    const submitButton = e.target.closest('button')
    const form = this.#form()
    const valid = form.reportValidity()

    if (valid) {
      const request = this.formData(form)
      console.log('submit request', request)
      try {
        const uploaded = await this.cloudinary(request, form)
        const response = await apiFetch(API, request)
        console.log('submit response', response, uploaded)

        const isCreateAction = this.#isCreate()
        if (isCreateAction) {
          this.append(response)
        }

        const isUpdateAction = this.#isUpdate()
        if (isUpdateAction) {
          const { id } = response
          const article = document.getElementById(id)
          this.#fill(form, article, response)
        }

        this.close(e)
      } catch (error) {
        // TODO: pop up an error dialog?
        console.error('submit failed', error)
        this.error(error)
      }
    }
  }

  #error(message) {
    this.errorMessage.textContent = message
    this.errorDialog.showModal()
  }

  error(error) {
    let { message, cause } = error
    console.log(`error`, { message, cause })

    if (cause) {
      let { duplicate, name } = cause
      if (duplicate) {
        message = `"${name}" already exists as a ${this.typeName}`
        this.#error(message)
        return
      }

      if (message === 'fetch failed') {
        if (offline()) {
          return this.#error('not connected to the internet')
        }

        return this.#error('database is not available')
      }

      if (message === 'db failed') {
        const { path } = cause
        if (path?.includes('Update')) {
          // TODO: const name = formattedName(Elements.form.dataset.name)
          message = `Cannot update as it has been deleted by another user!`
        }
        this.#error(message)
        return
      }
    }

    // prettify timeout errors
    if (message.toLowerCase().includes('timeout')) {
      message = `db server timed out, which means the action may not have completed`
      // Elements.error.textContent = message
      this.#error(message)
      return
    }

    // prettify object deleted errors
    if (message.includes('has already been deleted!')) {
      this.#error(message)
      return
    }

    if (message.includes('has been deleted')) {
      this.#error(message)
      return
    }

    message = `Application Error: ${message}`
    this.#error(message)
  }

  filter(e) {
    const search = e.target.value
    const articles = Array.from(this.elements.children)
    console.log('search', search, articles)
    articles.forEach((article) => {
      if (search === '') {
        // show everything
        article.style.display = 'grid'
        return
      }

      const nameElement = article.querySelector('[data-name="name"]')
      const name = nameElement.textContent.toLowerCase()

      const lowerCaseSearch = search.toLowerCase()
      let hide = true
      if (name.includes(lowerCaseSearch)) hide = false

      // hide the article
      if (hide) article.style.display = 'none'
      if (!hide) article.style.display = 'grid'
    })
  }

  addToCollection(e) {
    const button = e.target.closest('button')
    const details = button.closest('details')
    const summary = details.querySelector('summary')

    const content = details.querySelector('.details-content')
    const type = details.dataset.type
    const field = details.dataset.field

    const elementType = this.htmls[type].fields[field].element
    let html = this.htmls[elementType]
    console.log('addToCollection', field, type, html, elementType)
    html.details(field, content)
    const added = content.firstElementChild
    summary.innerHTML = `${field}<sup>(${content.children.length})</sup>`
    this.#addToEventListeners(added)
  }

  #addToEventListeners(element, object) {
    const isCreate = this.#isCreate()
    isCreate
      ? element.addEventListener(
          'toggle',
          this.#detailsElementCreate.bind(this),
        )
      : element.addEventListener(
          'toggle',
          this.#detailsElementUpdate.bind(this),
        )

    const deleteButton = element.querySelector('.delete-from-collection')
    deleteButton?.addEventListener(
      'click',
      this.deleteFromCollection.bind(this),
    )

    // if the element has collections add event listeners to it
    const details = Array.from(element.querySelectorAll('details'))
    details.forEach((detail) => {
      this.#addToEventListeners(detail, object)
      const add = detail.querySelector('.add-to-collection')
      add.addEventListener('click', this.addToCollection.bind(this))
    })

    // if an object was given, watch for change events
    if (object) {
      const inputs = Array.from(
        element.querySelectorAll('input,textarea,select'),
      )
      inputs.forEach((input) => {
        if (input.dataset.system) {
          console.log('#addTo skipping', input.name)
          return
        }
        input.addEventListener('change', (e) => {
          const element = e.target
          const section = element.closest('fieldset')
          const id = section.firstElementChild

          const begin = section.closest('input[data-element-begin]')
          console.log('begin', begin)
          if (begin) {
            // denotes an element with collections inside
            const end = begin.nextElementSibling.nextElementSibling
            console.log('end', end)
            begin.name = `update-${begin.name.split('-').slice(1).join('-')}`
            end.name = `update-${end.name.split('-').slice(1).join('-')}`
          }
          element.name = `update-${element.name.split('-').slice(1).join('-')}`
          id.name = `update-${id.name.split('-').slice(1).join('-')}`

          const { name, value } = element
          console.log('#addTo change', name, value)
        })
      })
    }
  }

  async #detailsElementCreate(e) {
    const details = e.target
    console.log('detailsElementCreate', this.#isCreate(), details.open)
  }

  async #detailsElementUpdate(e) {
    const details = e.target
    const { type, field } = details.dataset

    // if field is not present we're simply opening the containing details
    if (!field) return

    const summary = details.firstElementChild
    const content = details.querySelector('.details-content')
    const open = details.open

    const id = details.parentElement.parentElement.id

    const action = field
    const subaction = 'list'
    const request = { action, subaction, type, id }

    console.log('detailsElementUpdate', this.#isUpdate(), {
      details,
      open,
      type,
      field,
      id,
      request,
    })

    try {
      // only action read request on open
      if (open) {
        const elementType = this.htmls[type].fields[field].element
        let html = this.htmls[elementType]
        const response = await apiFetch(API, request)

        console.log(`${type}.${field} fetched ${response.length}`)
        response.forEach((object) => {
          html.details(field, content, object)
          const added = content.firstElementChild
          summary.innerHTML = `${field}<sup>(${content.children.length})</sup>`
          this.#addToEventListeners(added, object)
        })
        return
      }

      if (!open) {
        // we need to purge read data and re-fetch on open because it may have been remotely changed
        const wereFetched = Array.from(
          content.querySelectorAll('[data-fetched]'),
        )
        console.log(`${type}.${field} wereFetched ${wereFetched.length}`)
        wereFetched.forEach((fetched) => fetched.remove())
        return
      }
    } catch (error) {
      console.error('#detailsElementUpdate', error)
      this.error(error)
    }
  }

  deleteFromCollection(e) {
    const deleteButton = e.target.closest('button')
    const element = deleteButton.closest('details')
    const content = element.parentElement
    const dialogDetail = element.closest('.dialog-details')
    const summary = dialogDetail.querySelector('summary')
    const field = dialogDetail.dataset.field
    const isCreateAction = this.#isCreate()
    console.log({
      element,
      content,
      dialogDetail,
      summary,
      field,
      isCreateAction,
    })

    if (isCreateAction) {
      // element can simply be removed
      element.remove()
      const count = content.children.length
      summary.innerHTML = count ? `${field}<sup>(${count})</sup>` : field
    }

    if (!isCreateAction) {
      const fetched = element.dataset.fetched

      if (!fetched) {
        element.remove()
        const toBeDeleted = Array.from(
          content.querySelectorAll('[data-deleted]'),
        ).length
        const count = content.children.length - toBeDeleted
        summary.innerHTML = count ? `${field}<sup>(${count})</sup>` : field
        return
      }
      // it can simply be removed

      if (fetched) {
        // mark it's id as deleted, remove from display, and purge the other inputs so they don't go in formData
        element.style.display = 'none'
        element.dataset.deleted = true
        const elementDetailsContent = element.querySelector(
          '.element-details-content',
        )
        const idInput = elementDetailsContent.firstElementChild
        const name = idInput.name
        const parts = name.split('-').slice(1).join('-')
        idInput.name = `delete-${parts}`
        const deleteInputs = Array.from(elementDetailsContent.children).slice(1)
        deleteInputs.forEach((input) => input.remove())

        // count the number marked for deletion
        const toBeDeleted = Array.from(
          content.querySelectorAll('[data-deleted]'),
        ).length
        const count = content.children.length - toBeDeleted
        summary.innerHTML = count ? `${field}<sup>(${count})</sup>` : field
        return
      }
    }
  }
}

export default PageController
