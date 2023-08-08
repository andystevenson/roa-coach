import path from 'path'
import './protected-page.mjs'
import pluralize from 'pluralize'

const pathname = window.location.pathname
const page = pathname.slice(1, pathname.lastIndexOf('/'))
const title = pluralize.singular(page)
const Elements = {
  add: document.getElementById('add'),
  modal: document.getElementById('add-modal'),
  title: document.getElementById('add-modal-title'),
  close: document.getElementById('add-modal-close'),
  form: document.getElementById('add-modal-form'),
  cancel: document.getElementById('add-modal-cancel'),
  submit: document.getElementById('add-modal-submit'),
}

// optional image elements
const ImageElements = {
  image: document.getElementById('add-modal-image'),
  selector: document.getElementById('add-modal-image-selector'),
  status: document.getElementById('add-modal-image-status'),
  img: document.getElementById('add-modal-img'),
}

let LayoutExpected = Object.values(Elements).every((element) => element)
const name = 'add-modal'

if (!LayoutExpected) {
  console.error(`${name} layout unexpected!`)
}

const DefaultImage =
  'https://res.cloudinary.com/andystevenson/image/upload/e_blur:100,o_20/v1691413940/roa/alumni-template.avif'

const setDefaultImage = () => {
  if (ImageElements.image) {
    ImageElements.img.src = DefaultImage
  }
}
const openModal = () => {
  setDefaultImage()
  Elements.modal.showModal()
}

const closeModal = () => {
  setDefaultImage()
  Elements.form.reset()
  Elements.modal.close()
}

Elements.title.textContent = title
Elements.add.addEventListener('click', openModal)
Elements.close.addEventListener('click', closeModal)
Elements.cancel.addEventListener('click', () => {
  console.warn('cancelling....')
  closeModal()
})

Elements.form.addEventListener('submit', (e) => {
  e.preventDefault()
  const data = new FormData(Elements.form)
  if (ImageElements.image) {
    data.append('image', ImageElements.img.src)
  }
  const addData = Object.fromEntries(data.entries())
  console.warn('submitting....', { addData })
  closeModal()
})

// handle image upload

LayoutExpected = Object.values(ImageElements).every((element) => element)

if (ImageElements.image && !LayoutExpected) {
  console.error(`${name}-image layout unexpected`)
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
