import './protected-page.mjs'
import { apiFetch } from './utilities.mjs'
import { offline } from './network-status.mjs'
import { Pathname, Page, Title, Api } from './page-info.mjs'

const NetworkDownIcon = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-wifi-off" viewBox="0 0 16 16">
  <path d="M10.706 3.294A12.545 12.545 0 0 0 8 3C5.259 3 2.723 3.882.663 5.379a.485.485 0 0 0-.048.736.518.518 0 0 0 .668.05A11.448 11.448 0 0 1 8 4c.63 0 1.249.05 1.852.148l.854-.854zM8 6c-1.905 0-3.68.56-5.166 1.526a.48.48 0 0 0-.063.745.525.525 0 0 0 .652.065 8.448 8.448 0 0 1 3.51-1.27L8 6zm2.596 1.404.785-.785c.63.24 1.227.545 1.785.907a.482.482 0 0 1 .063.745.525.525 0 0 1-.652.065 8.462 8.462 0 0 0-1.98-.932zM8 10l.933-.933a6.455 6.455 0 0 1 2.013.637c.285.145.326.524.1.75l-.015.015a.532.532 0 0 1-.611.09A5.478 5.478 0 0 0 8 10zm4.905-4.905.747-.747c.59.3 1.153.645 1.685 1.03a.485.485 0 0 1 .047.737.518.518 0 0 1-.668.05 11.493 11.493 0 0 0-1.811-1.07zM9.02 11.78c.238.14.236.464.04.66l-.707.706a.5.5 0 0 1-.707 0l-.707-.707c-.195-.195-.197-.518.04-.66A1.99 1.99 0 0 1 8 11.5c.374 0 .723.102 1.021.28zm4.355-9.905a.53.53 0 0 1 .75.75l-10.75 10.75a.53.53 0 0 1-.75-.75l10.75-10.75z"/>
</svg>`

const NetworkDownError = {
  message: 'your network connection is down',
  cause: {},
}

const DefaultImage =
  'https://res.cloudinary.com/andystevenson/image/upload/e_blur:100,o_20/v1691413940/roa/alumni-template.avif'

const handleModal = (type) => {
  const action = type
  const modalName = `${type}-modal`

  const Elements = {
    create: document.getElementById('create'), // special case of Page level add
    modal: document.getElementById(modalName),
    title: document.getElementById(`${modalName}-title`),
    close: document.getElementById(`${modalName}-close`),
    form: document.getElementById(`${modalName}-form`),
    error: document.getElementById(`${modalName}-error`),
    cancel: document.getElementById(`${modalName}-cancel`),
    submit: document.getElementById(`${modalName}-submit`),
  }

  // optional image elements
  const modalImageName = `${modalName}-image`
  const ImageElements = {
    image: document.getElementById(modalImageName),
    selector: document.getElementById(`${modalImageName}-selector`),
    status: document.getElementById(`${modalImageName}-status`),
    img: document.getElementById(`${modalImageName}-img`),
  }

  let LayoutExpected = Object.values(Elements).every((element) => element)

  if (!LayoutExpected) {
    console.error(`${modalName} layout unexpected!`)
  }

  const setDefaultImage = () => {
    if (ImageElements.image) {
      if (offline()) {
        ImageElements.img.src = NetworkDownIcon
        return
      }
      ImageElements.img.src = DefaultImage
    }
  }

  const clearErrorMessage = () => {
    Elements.error.textContent = ''
  }

  const errorMessage = (error) => {
    let { message, cause } = error
    if (cause) {
      let { duplicate, name } = cause
      if (duplicate) message = `"${name}" already exists as ${Title}`
      Elements.error.textContent = message
      return
    }

    // prettify timeout errors
    if (message.toLowerCase().includes('timeout')) {
      message = `server timed out, which means the action may not have completed`
    }
    message = `Application Error: ${message}`
    Elements.error.textContent = message
    console.error(error)
  }

  const openModal = () => {
    clearErrorMessage()
    if (offline()) errorMessage(NetworkDownError)
    setDefaultImage()
    Elements.modal.showModal()
  }

  const closeModal = () => {
    clearErrorMessage()
    setDefaultImage()
    Elements.form.reset()
    Elements.modal.close()
  }

  Elements.title.textContent = Title
  type === 'create' && Elements.create.addEventListener('click', openModal)
  Elements.close.addEventListener('click', closeModal)
  Elements.cancel.addEventListener('click', closeModal)

  const startLoading = () => Elements.submit.classList.add('loading')
  const stopLoading = () => Elements.submit.classList.remove('loading')

  window.addEventListener('offline', () => {
    errorMessage(NetworkDownError)
    setDefaultImage()
  })
  window.addEventListener('online', () => {
    clearErrorMessage()
    setDefaultImage()
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (offline()) return errorMessage(NetworkDownError)
    try {
      startLoading()
      const data = new FormData(Elements.form)
      data.append('action', action)
      data.append('pathname', Pathname)
      data.append('page', Page)
      data.append('title', Title)
      const request = Object.fromEntries(data.entries())

      if (ImageElements.image) {
        request.image = ImageElements.img.src
        request.uploaded = await apiFetch('/api/cloudinary-upload', request)
        request.image = request.uploaded.portrait
        request.thumbnail = request.uploaded.thumbnail
      }
      console.warn('submitting....', { request })

      const response = await apiFetch(Api, request)
      console.warn(response)
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

  Elements.form.addEventListener('submit', handleSubmit)

  // handle image upload

  LayoutExpected = Object.values(ImageElements).every((element) => element)

  if (ImageElements.image && !LayoutExpected) {
    console.error(`${modalImageName} layout unexpected`)
  }

  const HandleImageUpload =
    window.FileList &&
    window.File &&
    window.FileReader &&
    ImageElements.image &&
    LayoutExpected

  if (HandleImageUpload) {
    ImageElements.image.addEventListener('click', () =>
      ImageElements.selector.click(),
    )
    ImageElements.selector.addEventListener('change', (event) => {
      ImageElements.img.src = DefaultImage
      ImageElements.status.textContent = ''
      if (event.target.files.length < 1) return

      const file = event.target.files[0]
      if (!file.type) {
        ImageElements.status.textContent =
          'The File.type property does not appear to be supported on this browser!'
        return
      }

      if (!file.type.match('image.*')) {
        ImageElements.status.textContent =
          'The selected file does not appear to be an image.'
        return
      }

      const reader = new FileReader()
      reader.addEventListener('load', (event) => {
        ImageElements.img.src = event.target.result
      })
      reader.readAsDataURL(file)
    })
  }
}

handleModal('create')
handleModal('update')
