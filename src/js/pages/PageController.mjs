import schema from '../../../grafbase/schema.graphql?raw'
import Schema from '../../grafbase/Schema.mjs'
import TypeHTML from './TypeHTML.mjs'
import { ordinalDateTime, today } from '../../grafbase/dates.mjs'
import { apiFetch } from './utilities.mjs'
import { offline } from './network-status.mjs'
import { Page } from './page-info.mjs'
import isEmpty from 'lodash.isempty'

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
    this.#addPageListeners()
    console.log('PageController', this)
  }

  #types() {
    this.schema.types.forEach((type) => {
      this.types[type.name] = type
    })
    this.type = this.types[this.typeName]
  }
  f
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

  // #addDialogListeners()
  // attach event listeners to all the key dialog buttons.
  // attach event listeners to all the dialog-inputs of the form
  // attach event listeners to all details within the dialog-collections

  #addDialogListeners(dialog, mode) {
    //
    const close = document.getElementById('close-dialog')
    close.addEventListener('click', this.close.bind(this))

    const cancel = document.getElementById('cancel-action')
    cancel.addEventListener('click', this.cancel.bind(this))

    const deleteMe = document.getElementById('delete-action')
    deleteMe.addEventListener('click', this.delete.bind(this))

    const submit = document.getElementById('submit-action')
    submit.addEventListener('click', this.submit.bind(this))

    const form = this.#form()

    if (mode === 'update') {
      const dialogInputs = form.querySelector('.dialog-inputs')
      this.#addInputChangeListeners(dialogInputs)
    }

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

  async #detailsUpdate(e) {
    const details = e.target
    const summary = details.querySelector('summary')
    const field = details.dataset.field
    const open = details.open
    const content = details.querySelector('.details-content')

    try {
      // only action read request on open
      if (open) {
        let { id, type } = this.#form().dataset

        const fieldType = this.fields[field]
        const element = fieldType.element
        const html = this.htmls[element]

        const request = { id, action: field, type, subaction: 'list' }
        await this.#addFetched(html, request, field, content, summary)

        return
      }

      if (!open) {
        this.#removeFetched(content)
      }
    } catch (error) {
      console.log(`#detailsUpdate error`, error)
      this.error(error)
    }
  }

  #showModal(e, mode = 'create') {
    this.dialogs.innerHTML = ''
    this.dialogs.innerHTML = this.html.dialog(mode)
    const dialog = this.dialogs.firstElementChild
    this.#addDialogListeners(dialog, mode)
    dialog.showModal()
  }

  #addPageListeners() {
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

  #fill(form, article, from) {
    //  fill in the modal form with data from
    const { id } = from
    form.id = id
    form.dataset.id = id
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

      if (aKey) aKey.textContent = value
      if (dKey) dKey.value = value
    })
  }

  async update(e) {
    const article = e.target.closest('article')
    try {
      // make a read request for the element being updated
      const request = {
        id: article.id.replace('-article', ''),
        type: this.typeName,
        action: 'read',
      }
      const response = await apiFetch(API, request)

      const mode = 'update'
      this.#showModal(e, mode)
      const form = this.#form()

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
    const name = article.querySelector('[data-name="name"]')
    const image = article.querySelector('[data-name="image"]')
    const thumbnail = article.querySelector('[data-name="thumbnail"]')
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
    this.elements.innerHTML = elements
      .map((element) => this.html.from(element))
      .join('')

    Array.from(this.elements.children).forEach((element) =>
      this.#elementEventListeners(element),
    )
  }

  // cloudinary()
  // saves an image to the cloudinary repository
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

  // fetch()
  // fetch the current list of objects for this page
  // TODO: put it in a worker thread?
  async fetch() {
    // fetch the current list of elements of (this.type)
    const request = { action: 'list', type: this.typeName }
    try {
      const response = await apiFetch(API, request)
      this.load(response)
    } catch (error) {
      console.error(`${this.typeName} fetch failed`, error)
      this.error(error)
    }
  }

  // request() creation. A vital part of the DOM interface.
  // request(), #requestType(), #requestField(), #requestInputs() recursively build up the
  // required ROAclient.invoke() formatted request.

  #requestInputs(request, inputs) {
    for (const input of inputs) {
      const { type, value } = input

      // ignore the name attribute of the input because this could be mangled for
      // multiple instances of the same input in a collection
      const name = input.dataset.name

      // if name is undefined, skip it as it is being used for internal purposes
      if (!name) continue

      // these are grafbase generated so ignore them
      if (name === 'createdAt' || name === 'updatedAt') continue

      // type="time" inputs need to be updated to an ISO date time string because
      // grafbase doesn't have a Time type.

      if (type === 'time') {
        const [hour, minute] = value.split(':')
        const newTime = today.hour(+hour).minute(+minute).toISOString()
        request[name] = newTime
        continue
      }

      request[name] = value
    }
  }

  #inputs(element) {
    return Array.from(element.querySelectorAll('input,select,textarea'))
  }

  #requestField(request, field) {
    const name = field.dataset.field
    const selector =
      ':scope > .details-content > .element-details > .element-details-content'
    let fieldsets = Array.from(field.querySelectorAll(selector)).filter(
      (fieldset) => !fieldset.dataset.ignore,
    )
    if (fieldsets.length === 0) return

    request[name] = { create: [], update: [], delete: [] }
    for (const fieldset of fieldsets) {
      const { update, deleted } = fieldset.dataset

      const element = {}
      this.#requestType(element, fieldset)
      //
      if (update) {
        request[name].update.push(element)
        continue
      }

      if (deleted) {
        request[name].delete.push(element)
        continue
      }

      // this is a create request
      request[name].create.push(element)
    }

    if (request[name].create.length === 0) delete request[name].create
    if (request[name].update.length === 0) delete request[name].update
    if (request[name].delete.length === 0) delete request[name].delete
    if (isEmpty(request[name])) delete request[name]
  }

  #requestType(request, start) {
    const { type, update, deleted, ignore } = start.dataset
    let fieldset = start.querySelector('.dialog-inputs')
    if (!fieldset) return
    if (ignore) return

    // this edge case handles the form inputs, which can still be ignored, even if the form
    // is marked as update due to a lower level update.

    const ignoreInputs = fieldset.dataset.ignore
    if (!ignoreInputs) {
      let inputs = this.#inputs(fieldset)
      if (update) inputs = inputs.filter((input) => input.dataset.update)
      if (deleted) inputs = inputs.filter((input) => input.dataset.deleted)
      this.#requestInputs(request, inputs)
    }

    let collections = start.querySelector('.dialog-collections')
    if (collections) {
      const selector = `[data-type="${type}"][data-field]`
      const fields = Array.from(collections.querySelectorAll(selector))
      for (const field of fields) {
        this.#requestField(request, field)
      }
    }
  }

  request() {
    const form = this.#form()
    const { type, action, id } = form.dataset
    const request =
      action === 'create' ? { type, action } : { id, type, action }
    this.#requestType(request, form)

    return request
  }

  // close()
  // closes the modal dialog.
  close(e) {
    const closeButton = e.target.closest('button')
    const dialog = closeButton.closest('dialog')
    dialog.close()
  }

  // cancel()
  // simply closes the modal dialog.
  cancel(e) {
    this.close(e)
  }

  async delete(e) {
    const form = this.#form()
    const id = form.getAttribute('id')
    if (!id) return

    try {
      const request = { action: 'delete', type: this.typeName, id }
      const response = await apiFetch(API, request)
      const article = document.getElementById(`${id}-article`)
      article?.remove()
      this.close(e)
    } catch (error) {
      this.error(error)
    }
  }

  #isCreate() {
    const form = this.#form()
    return form.dataset.action === 'create'
  }

  #isUpdate() {
    const form = this.#form()
    return form.dataset.action === 'update'
  }

  async submit(e) {
    e.preventDefault()
    console.log(`submit called`, e.target, this)
    const form = this.#form()
    const valid = form.reportValidity()

    if (valid) {
      const request = this.request()
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
          const article = document.getElementById(`${id}-article`)
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

  // error()
  // tries to analyse the error message sent and turn it into something useful for the user
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
    const added = html.details(field, content)
    const fieldset = added.closest('fieldset')
    fieldset && this.#markAs(fieldset.firstElementChild, 'update')
    this.#addToEventListeners(added)

    const form = this.#form()
    delete form.dataset.ignore
    this.#collectionCount(content, summary)
    added.scrollIntoView({ behavior: 'smooth' })
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

    // if an object was given, watch for change events, and mark them accordingly
    if (object) this.#addInputChangeListeners(element)
  }

  // #addInputChangeListeners(element)
  // installs listeners to watch for change events on elements inputs

  #addInputChangeListeners(element) {
    const inputs = this.#inputs(element)

    inputs.forEach((input) => {
      // skip readonly system inputs (id, createdAt, updatedAt)
      if (input.dataset.system) return
      input.addEventListener('change', this.#inputChange.bind(this))
    })
  }

  // #inputChange()
  // watch for a change event on an input mark the form, fieldset and its parent as updated.
  // this ensures that when an update request is sent, only those fields and objects
  // actually updated are sent in the request.active

  #inputChange(e) {
    const element = e.target
    const fieldset = element.closest('fieldset')
    const parent = fieldset.parentElement
    const id = fieldset.firstElementChild
    const form = this.#form()
    id.dataset.update = true
    element.dataset.update = true

    this.#markAs(fieldset, 'update')
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

    try {
      // only action read request on open
      if (open) {
        const elementType = this.htmls[type].fields[field].element
        let html = this.htmls[elementType]
        await this.#addFetched(html, request, field, content, summary)
      }

      if (!open) {
        this.#removeFetched(content)
      }
    } catch (error) {
      console.error('#detailsElementUpdate', error)
      this.error(error)
    }
  }

  async #addFetched(html, request, field, content, summary) {
    // if there are any elements in the content, keep a copy of them so we can insert them
    // after the fetched objects

    const children = Array.from(content.children).map((child) =>
      content.removeChild(child),
    )
    const response = await apiFetch(API, request)

    response.forEach((object) => {
      const added = html.details(field, content, object)
      this.#addToEventListeners(added, object)
      this.#collectionCount(content, summary)
    })

    children.forEach((child) => content.appendChild(child))
  }

  #removeFetched(content) {
    // we need to purge read data and re-fetch on open because it may have been remotely changed
    const wereFetched = Array.from(content.querySelectorAll('[data-fetched]'))
    wereFetched.forEach((fetched) => fetched.remove())
    return
  }

  deleteFromCollection(e) {
    const deleteButton = e.target.closest('button')
    const element = deleteButton.closest('details')
    const content = element.parentElement
    const dialogDetail = element.closest('.dialog-details')
    const summary = dialogDetail.querySelector('summary')
    const isCreateAction = this.#isCreate()

    const fetched = element.dataset.fetched

    if (isCreateAction || !fetched) {
      // element can simply be removed
      element.remove()
      this.#collectionCount(content, summary)
      return
    }

    // we're in an update

    // mark it's id as deleted, remove from display, and purge the other inputs
    // as they are not required for the delete
    element.style.display = 'none'
    element.dataset.deleted = true
    const dialogInputs = element.querySelector('.dialog-inputs')

    // update the id field as deleted!
    dialogInputs.firstElementChild.dataset.deleted = true

    const deleteInputs = Array.from(dialogInputs.children).slice(1)
    deleteInputs.forEach((input) => input.remove())

    this.#markAs(dialogInputs, 'deleted')
    this.#collectionCount(content, summary)
  }

  #collectionCount(content, summary) {
    // update the details count
    const toBeDeleted = Array.from(
      content.querySelectorAll(':scope > [data-deleted]'),
    ).length
    const count = content.children.length - toBeDeleted
    const field = summary.textContent.split('(')[0]
    summary.innerHTML = count ? `${field}<sup>(${count})</sup>` : field
  }

  #markAs(fieldset, something) {
    if (this.#isCreate()) return
    delete fieldset.dataset.ignore
    delete fieldset.dataset.update
    delete fieldset.dataset.deleted
    fieldset.dataset[something] = true
    let parent = fieldset.parentElement
    parent.dataset[something] = true
    while (parent) {
      delete parent.dataset.ignore
      delete parent.dataset.update
      if (!parent.dataset.deleted) parent.dataset.update = true
      parent = parent.parentElement.closest('fieldset')
    }
    const form = this.#form()
    delete form.dataset.ignore
  }
}

export default PageController
