import './protected-page.mjs'
import { apiFetch } from './utilities.mjs'
import { offline } from './network-status.mjs'
import layout from './modal-layout.mjs'
import handleLayout from './handle-layout.mjs'
import { objectHTML } from './handlers/collection.mjs'
import { elementFromHTML } from './utilities.mjs'

const NetworkDownError = {
  message: 'your network connection is down',
  cause: {},
}

const handleModal = (type) => {
  const action = type

  const { Elements, ImageElements } = layout(type)
  const {
    openModal,
    closeModal,
    errorMessage,
    clearErrorMessage,
    startLoading,
    stopLoading,
    setDefaultImage,
    formData,
  } = handleLayout(Elements, ImageElements)

  const handleOffline = () => {
    errorMessage(NetworkDownError)
    setDefaultImage()
  }

  const handleOnline = () => {
    clearErrorMessage()
    setDefaultImage()
  }

  type === 'create' && Elements.create.addEventListener('click', openModal)
  Elements.close.addEventListener('click', closeModal)
  Elements.cancel.addEventListener('click', closeModal)

  window.addEventListener('offline', handleOffline)
  window.addEventListener('online', handleOnline)

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
      if (!request.image) request.image = ImageElements.default
      if (!request.thumbnail) request.thumbnail = ImageElements.thumbnail

      const updated = ImageElements.image.dataset.updated
      if (!updated) {
        console.log('image did not update')
        // nothing to upload to cloudinary
        return
      }
      request.image = ImageElements.img.src
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
    const button = e.target.closest('button')
    console.log('handleDelete', button)
    const id = button.dataset.id
    const displayElement = document.getElementById(id)
    displayElement?.remove()
    const request = formData()
    request.action = 'delete'
    request.id = id
    const response = await apiFetch(Elements.api, request, 'DELETE')
    console.log('handleDelete', { response })
    closeModal()
  }
  Elements.form.addEventListener('submit', handleSubmit)
  Elements.delete.addEventListener('click', handleDelete)
}

handleModal('create')
handleModal('update')
