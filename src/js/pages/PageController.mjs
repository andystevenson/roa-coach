import Schema from '../../../grafbase/src/Schema.mjs'
import schema from '../../../grafbase/schema.graphql?raw'
import TypeHTML from './TypeHTML.mjs'
import { ordinalDateTime } from '../../../grafbase/src/dates.mjs'
import { apiFetch } from './utilities.mjs'
import { offline } from './network-status.mjs'
import { Page } from './page-info.mjs'
import { today } from '../../../grafbase/src/dates.mjs'

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

  #addModalEventListeners(dialog) {
    const close = document.getElementById('close-dialog')
    close.addEventListener('click', this.close.bind(this))

    const cancel = document.getElementById('cancel-action')
    cancel.addEventListener('click', this.cancel.bind(this))

    const deleteMe = document.getElementById('delete-action')
    deleteMe.addEventListener('click', this.delete.bind(this))

    const submit = document.getElementById('submit-action')
    submit.addEventListener('click', this.submit.bind(this))

    const collections = Array.from(
      dialog.querySelectorAll('.add-to-collection'),
    )

    collections.forEach((add) =>
      add.addEventListener('click', this.addToCollection.bind(this)),
    )
  }

  #showModal(e) {
    this.dialogs.innerHTML = ''
    this.dialogs.innerHTML = this.html.dialog()
    const dialog = this.dialogs.firstElementChild
    this.#addModalEventListeners(dialog)
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

  #correctDateTimeValues(data, form) {
    const times = Array.from(form.querySelectorAll('input[type="time"]'))
    times.forEach((time) => {
      const { id, value } = time
      const [hour, minute] = value.split(':')
      const newTime = today.hour(+hour).minute(+minute).toISOString()
      data.set(id, newTime)
      console.log('#correctDateTimeValues', id, value, newTime, data.get(id))
    })
  }

  #stripEmptyFields(formData) {
    // TODO: hmmm, not sure this shouldn't be field validated for nullable etc
    const stripThese = Array.from(formData.entries())
      .filter(([_, value]) => !value)
      .forEach(([name]) => formData.delete(name))
  }

  #fill(form, article, from) {
    //  fill in the modal with data from
    const keys = Object.keys(from)
    keys.forEach((key) => {
      const value = from[key]
      const dKey = form.querySelector(`[name="${key}"]`)
      const aKey = article.querySelector(`[data-name="${key}"]`)
      console.log('fill ', key, value, dKey, aKey)
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

      this.#showModal(e)
      const form = this.dialogs.firstElementChild.querySelector('form')

      const action = form.querySelector('[name="action"]')
      action.value = 'update'

      const dialog = form.closest('dialog')
      dialog.classList.add('update')

      this.#fill(form, article, response)
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
    this.elements.insertAdjacentHTML('beforeend', html)
    const added = this.elements.lastElementChild
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

  formData(form) {
    const data = new FormData(form)
    // strip system attributes from any request
    data.delete('createdAt')
    data.delete('updatedAt')
    // strip file input from request as it relates to internal image reader
    data.delete('file')
    this.#stripEmptyFields(data)
    this.#correctDateTimeValues(data, form)
    return Object.fromEntries(data.entries())
  }

  close(e) {
    const closeButton = e.target.closest('button')
    const dialog = closeButton.closest('dialog')
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
      this.error(`delete failed on ${id}`)
    }
  }

  #isCreate(form) {
    return form.querySelector('[name="action"]').value === 'create'
  }

  #isUpdate(form) {
    return form.querySelector('[name="action"]').value === 'update'
  }

  async submit(e) {
    e.preventDefault()
    console.log(`submit called`, e.target, this)
    const submitButton = e.target.closest('button')
    const form = submitButton.closest('form')
    const valid = form.reportValidity()

    if (valid) {
      const request = this.formData(form)
      console.log('submit request', request)
      try {
        const uploaded = await this.cloudinary(request, form)
        const response = await apiFetch(API, request)
        console.log('submit response', response, uploaded)

        const isCreateAction = this.#isCreate(form)
        if (isCreateAction) {
          this.append(response)
        }

        const isUpdateAction = this.#isUpdate(form)
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
    const field = details.dataset.field
    const fieldType = this.fields[field]
    const element = fieldType.element
    const html = this.htmls[element]
    console.log('addToCollection', field, element, html)
    html.details(field, content)
    const added = content.lastElementChild
    summary.innerHTML = `${field}<sup>(${content.children.length})</sup>`
    this.#addToEventListeners(added)
  }

  #addToEventListeners(element) {
    const deleteButton = element.querySelector('.delete-from-collection')
    deleteButton.addEventListener('click', this.deleteFromCollection.bind(this))
  }

  deleteFromCollection(e) {
    const deleteButton = e.target.closest('button')
    const element = deleteButton.closest('details')
    const content = element.parentElement
    const dialogDetail = element.closest('.dialog-details')
    const summary = dialogDetail.querySelector('summary')
    const field = dialogDetail.dataset.field
    const form = deleteButton.closest('form')
    const isCreateAction = this.#isCreate(form)
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
  }
}

export default PageController
