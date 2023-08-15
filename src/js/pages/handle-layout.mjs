import { formattedName } from './utilities.mjs'
import { Title } from './page-info.mjs'
import { offline } from './network-status.mjs'
import handleImage from './handle-image.mjs'
import { apiFetch } from './utilities.mjs'

export const handleLayout = (Elements, ImageElements) => {
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
    data.append('action', Elements.type)
    data.append('pathname', Elements.pathname)
    data.append('page', Elements.page)
    data.append('title', Title)
    data.append('collection', Elements.collection)
    data.append('object', Elements.object)
    return Object.fromEntries(data.entries())
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
        element.value = value
      }
    }
  }

  const openModal = async () => {
    console.log('openModal', Elements.modal)
    clearErrorMessage()
    if (offline()) errorMessage(NetworkDownError)
    setDefaultImage()
    Elements.title.textContent = Title

    if (Elements.type === 'update') {
      // read data before opening the modal
      const request = formData()
      request.action = 'read'
      const response = await apiFetch(Elements.api, request)
      console.log('openModal update response', response)
      updateForm(response)
    }
    Elements.modal.showModal()
  }

  const closeModal = () => {
    console.log('closeModal', Elements.modal, Elements.form)

    clearErrorMessage()
    setDefaultImage()
    Elements.form.reset()
    Elements.modal.close()
    Elements.search.dispatchEvent(new Event('input'))
  }

  const startLoading = () => Elements.submit.classList.add('loading')
  const stopLoading = () => Elements.submit.classList.remove('loading')
  const listView = () =>
    Elements.root.firstElementChild?.classList.add('list-view')
  const personView = () =>
    Elements.root.firstElementChild?.classList.remove('list-view')

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

  Elements.search.addEventListener('input', search)

  const setDefaultImage = handleImage(ImageElements)

  if (Elements.type === 'update') {
    const invokingUpdate = (e) => {
      const target = e.target
      const className = `.${Elements.object}`
      const alumnus = target.closest(className)
      const id = alumnus.id
      Elements.form.dataset.id = id
      Elements.delete.dataset.id = id
      Elements.submit.dataset.id = id
      openModal()
    }

    const watchForNewAlumnus = (mutations) => {
      const actions = Array.from(
        Elements.root.querySelectorAll('.update-action'),
      )
      actions.forEach((action) => {
        action.addEventListener('click', invokingUpdate)
      })
    }

    const observer = new MutationObserver(watchForNewAlumnus)
    observer.observe(Elements.root, { subtree: true, childList: true })
  }

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
