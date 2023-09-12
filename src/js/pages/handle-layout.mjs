import { Title } from './page-info.mjs'
import { offline, online } from './network-status.mjs'
import handleImage from './handle-image.mjs'
import { objectHTML } from './handlers/collection.mjs'
import { apiFetch, elementFromHTML, formattedName } from './utilities.mjs'
import { ordinalDateTime } from '../../../grafbase/src/dates.mjs'
// import { handleNotes, addExistingNotes } from './handle-notes.mjs'

const NetworkDownError = {
  message: 'your network connection is down',
  cause: {},
}

export const handleLayout = (Elements, ImageElements) => {
  const setDefaultImage = handleImage(ImageElements)

  const handleOffline = () => {
    errorMessage(NetworkDownError)
    setDefaultImage()
  }

  const handleOnline = () => {
    clearErrorMessage()
    setDefaultImage()
  }

  const errorMessage = (error) => {
    let { message, cause } = error
    console.log(`errorMessage`, { message, cause })

    if (cause) {
      let { duplicate, name } = cause
      if (duplicate) {
        message = `"${name}" already exists as ${Title}`
        Elements.error.textContent = message
        return
      }

      if (message === 'db failed') {
        const { path } = cause
        if (path.endsWith('Update')) {
          const name = formattedName(Elements.form.dataset.name)
          message = `"${name}" cannot be updated as it has been deleted by another user!`
        }
        Elements.error.textContent = message
        return
      }
    }

    // prettify timeout errors
    if (message.toLowerCase().includes('timeout')) {
      message = `db server timed out, which means the action may not have completed`
      Elements.error.textContent = message
      return
    }

    // prettify object deleted errors
    if (message.toLowerCase().includes('has already been deleted!')) {
      Elements.error.textContent = message
      return
    }

    if (message.toLowerCase().includes('has been deleted')) {
      Elements.error.textContent = message
      return
    }

    message = `Application Error: ${message}`
    Elements.error.textContent = message
    console.error(error)
  }

  const clearErrorMessage = () => {
    Elements.error.textContent = ''
  }

  const formData = () => {
    const data = new FormData(Elements.form)

    const dataset = Elements.form.dataset
    if ('id' in dataset) {
      const id = dataset.id
      data.append('id', id)
    }

    // the file input object should never be sent
    data.delete('file')

    data.append('action', Elements.type)
    data.append('pathname', Elements.pathname)
    data.append('page', Elements.page)
    data.append('title', Title)
    data.append('collection', Elements.collection)
    data.append('object', Elements.object)
    let entries = Object.fromEntries(data.entries())
    for (const property in entries) {
      if (property.startsWith('ignore.')) {
        delete entries[property]
        console.log('formData ... ignoring!!!', property)
      }
    }
    return entries
  }

  const updateForm = (response) => {
    const form = Elements.form
    for (const property in response) {
      // if the property exists on the form then update it
      if (property === 'image') {
        ImageElements.img.src = response.image
        continue
      }

      const element = form.querySelector(`[name=${property}]`)
      if (element) {
        let value = response[property]
        if (property === 'name') value = formattedName(value)
        if (property === 'createdAt' || property === 'updatedAt') {
          const oDateTime = ordinalDateTime(value)
          console.log({ property, value, oDateTime })
          value = oDateTime
        }
        element.value = value
      }
    }
  }

  const clearDetails = () => {
    // the details container contains all the fields requiring 'specific' editors
    console.log('clearDetails....')
    const details = document.querySelector(
      `[id$="${Elements.type}-modal-details"]`,
    )
    const collection = Array.from(details.querySelectorAll(`[id$="-detail"]`))

    for (const contents of collection) {
      const detail = contents.closest('details')
      detail.removeAttribute('open')
      contents.innerHTML = ''
    }
  }

  const openModal = async () => {
    clearErrorMessage()
    clearDetails()
    if (offline()) errorMessage(NetworkDownError)
    setDefaultImage()
    Elements.title.textContent = Title

    let request = null
    if (Elements.type === 'update' && online()) {
      // read data before opening the modal
      request = formData()
      request.action = 'read'
      request.name = Elements.form.dataset.name
      const id = Elements.form.dataset.id
      try {
        const response = await apiFetch(Elements.api, request)
        updateForm(response)
      } catch (error) {
        // the read action failed for some reason
        const { message, cause } = error
        console.error('read db failed', { message, cause, request })
        if (message.includes('db object not found')) {
          updateForm(request)
          error.message = `"${formattedName(request.name)}" has been deleted`
          const displayElement = document.getElementById(id)
          displayElement?.remove()
        }
        errorMessage(error)
      }
    }
    Elements.modal.showModal()
  }

  const closeOpenDetails = () => {
    // in the context of an 'update' this flushes out any dbActions that need doing
    const openDetails = Elements.form.querySelectorAll('details[open]')
    console.log('closeOpenDetails', openDetails)

    openDetails.forEach((detail) => detail.removeAttribute('open'))
  }

  const closeModal = () => {
    clearErrorMessage()
    setDefaultImage()
    Elements.form.reset()
    Elements.modal.close()
    Elements.search.dispatchEvent(new Event('input'))
  }

  const startLoading = () => Elements.submit.classList.add('loading')
  const stopLoading = () => Elements.submit.classList.remove('loading')

  const listView = () => {
    Elements.root.firstElementChild?.classList.add('list-view')
  }

  const personView = () => {
    Elements.root.firstElementChild?.classList.remove('list-view')
  }

  const search = (e) => {
    const searchName = e.target.value.toLowerCase()
    const searchList = Array.from(
      Elements.root.querySelectorAll('.object[name]'),
    )
    const objectList = searchList.map((object) => {
      const gName = object.getAttribute('name')
      const match = gName.includes(searchName)
      return { object, match }
    })
    objectList.forEach((searchObject) => {
      const { object, match } = searchObject
      match && object.classList.remove('search-hidden')
      !match && object.classList.add('search-hidden')
    })
  }

  const updateList = (response) => {
    const collection = Elements.collection
    const object = Elements.object
    response.collection = collection
    response.object = object

    const newElement = elementFromHTML(objectHTML(response))

    if (Elements.type === 'update') {
      const { id } = response
      const updatingElement = document.getElementById(id)
      updatingElement?.replaceWith(newElement)
      return
    }

    // create
    Elements.root.firstElementChild.appendChild(newElement)
  }

  const uploadImage = async (request) => {
    if (ImageElements.image) {
      request.image = ImageElements.img.src

      const updated = ImageElements.image.dataset.updated
      if (!updated) {
        console.log('image did not update')
        // nothing to upload to cloudinary
        return
      }
      console.log('image src', ImageElements.img.src.slice(0, 30))
      request.uploaded = await apiFetch('/api/cloudinary-upload', request)
      request.image = request.uploaded.portrait
      request.thumbnail = request.uploaded.thumbnail
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (offline()) return errorMessage(NetworkDownError)
    try {
      startLoading()

      const request = formData()

      await uploadImage(request)

      console.warn('submitting....', { request })

      closeOpenDetails()

      const response = await apiFetch(Elements.api, request, Elements.method)
      updateList(response)
      // console.warn(response)
      stopLoading()

      closeModal()
    } catch (error) {
      const { cause, message } = error
      console.error('filling in error', { message, cause })
      errorMessage(error)
      stopLoading()
      // closeModal()
    }
  }

  const handleDelete = async (e) => {
    console.log('handleDelete', e.target)
    if (offline()) return errorMessage(NetworkDownError)

    const button = e.target.closest('button')
    const id = button.dataset.id
    const displayElement = document.getElementById(id)

    if (!displayElement) {
      // this means the read request to openModel failed and the object has already been deleted in the database

      const name = formattedName(button.dataset.name)
      const message = `"${name}" has already been deleted!`
      errorMessage(new Error(message))
      return
    }

    // essential we don't trigger sub updates on deletion
    clearDetails()
    displayElement?.remove()
    const request = formData()
    request.action = 'delete'
    request.id = id
    const response = await apiFetch(Elements.api, request, 'DELETE')
    console.log('handleDelete', { response })
    closeModal()
  }

  if (Elements.type === 'update') {
    const invokingUpdate = (e) => {
      const target = e.target
      const className = `.${Elements.object}`
      const alumnus = target.closest(className)
      const id = alumnus.id
      const name = alumnus.getAttribute('name')
      Elements.form.dataset.name = name
      Elements.form.dataset.id = id
      Elements.delete.dataset.id = id
      Elements.delete.dataset.name = name
      Elements.submit.dataset.id = id
      Elements.submit.dataset.name = name
      openModal()
    }

    const watchForNewUpdateActions = (mutations) => {
      const actions = Array.from(
        Elements.root.querySelectorAll('.update-action'),
      )
      actions.forEach((action) => {
        action.addEventListener('click', invokingUpdate)
      })
    }

    const observer = new MutationObserver(watchForNewUpdateActions)
    observer.observe(Elements.root, { subtree: true, childList: true })
  }

  if (Elements.type === 'create') {
    Elements.create.addEventListener('click', openModal)
    Elements.listView.addEventListener('click', listView)
    Elements.personView.addEventListener('click', personView)
  }

  Elements.close.addEventListener('click', closeModal)
  Elements.cancel.addEventListener('click', closeModal)

  Elements.form.addEventListener('submit', handleSubmit)
  Elements.delete.addEventListener('click', handleDelete)

  Elements.search.addEventListener('input', search)

  window.addEventListener('offline', handleOffline)
  window.addEventListener('online', handleOnline)

  return {
    openModal,
    closeModal,
    errorMessage,
    clearErrorMessage,
    startLoading,
    stopLoading,
    listView,
    personView,
    setDefaultImage,
    formData,
  }
}

export default handleLayout
