import { offline } from './network-status.mjs'

export const NetworkDownIcon = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-wifi-off" viewBox="0 0 16 16">
  <path d="M10.706 3.294A12.545 12.545 0 0 0 8 3C5.259 3 2.723 3.882.663 5.379a.485.485 0 0 0-.048.736.518.518 0 0 0 .668.05A11.448 11.448 0 0 1 8 4c.63 0 1.249.05 1.852.148l.854-.854zM8 6c-1.905 0-3.68.56-5.166 1.526a.48.48 0 0 0-.063.745.525.525 0 0 0 .652.065 8.448 8.448 0 0 1 3.51-1.27L8 6zm2.596 1.404.785-.785c.63.24 1.227.545 1.785.907a.482.482 0 0 1 .063.745.525.525 0 0 1-.652.065 8.462 8.462 0 0 0-1.98-.932zM8 10l.933-.933a6.455 6.455 0 0 1 2.013.637c.285.145.326.524.1.75l-.015.015a.532.532 0 0 1-.611.09A5.478 5.478 0 0 0 8 10zm4.905-4.905.747-.747c.59.3 1.153.645 1.685 1.03a.485.485 0 0 1 .047.737.518.518 0 0 1-.668.05 11.493 11.493 0 0 0-1.811-1.07zM9.02 11.78c.238.14.236.464.04.66l-.707.706a.5.5 0 0 1-.707 0l-.707-.707c-.195-.195-.197-.518.04-.66A1.99 1.99 0 0 1 8 11.5c.374 0 .723.102 1.021.28zm4.355-9.905a.53.53 0 0 1 .75.75l-10.75 10.75a.53.53 0 0 1-.75-.75l10.75-10.75z"/>
</svg>`
export const DefaultPortrait =
  'https://res.cloudinary.com/andystevenson/image/upload/e_blur:100,o_20,c_fill,f_auto,g_face:center,q_auto/v1691413940/roa/alumni-template.avif'

export const DefaultImage = DefaultPortrait

export const DefaultThumbnail =
  'https://res.cloudinary.com/andystevenson/image/upload/e_blur:100,o_20,c_fill,f_auto,g_face:center,h_250,q_auto,w_250/v1691413940/roa/alumni-template.avif'

// export const handleImage = () => {
//   const HandleImageUpload = window.FileList && window.File && window.FileReader

//   if (HandleImageUpload) {
//     ImageElements.image.addEventListener('click', () =>
//       ImageElements.selector.click(),
//     )
//     ImageElements.selector.addEventListener('change', (event) => {
//       ImageElements.img.src = DefaultImage
//       ImageElements.status.textContent = ''
//       if (event.target.files.length < 1) return

//       const file = event.target.files[0]
//       if (!file.type) {
//         ImageElements.status.textContent =
//           'The File.type property does not appear to be supported on this browser!'
//         return
//       }

//       if (!file.type.match('image.*')) {
//         ImageElements.status.textContent =
//           'The selected file does not appear to be an image.'
//         return
//       }

//       const reader = new FileReader()
//       reader.addEventListener('load', (event) => {
//         ImageElements.img.src = event.target.result
//         ImageElements.image.dataset.updated = true
//       })
//       reader.readAsDataURL(file)
//     })
//   }

//   const setDefaultImage = () => {
//     delete ImageElements.image.dataset.updated
//     if (ImageElements.image) {
//       if (offline()) {
//         ImageElements.img.src = NetworkDownIcon
//         return
//       }
//       ImageElements.img.src = ImageElements.default
//     }
//   }

//   return setDefaultImage
// }

const handleImage = (e) => {
  const HandleImageUpload = window.FileList && window.File && window.FileReader
  if (!HandleImageUpload) return

  // we can handle image upload

  const button = e.target.closest('button')
  const img = button.firstElementChild
  const name = img.nextElementSibling
  const message = name.nextElementSibling
  const file = message.nextElementSibling
  const image = file.nextElementSibling

  file.addEventListener('change', () => {
    img.src = DefaultImage
    message.textContent = ''

    if (file.files.length < 1) return

    const newFile = file.files[0]
    if (!newFile.type) {
      message.textContent =
        'The File.type property does not appear to be supported on this browser!'
      return
    }

    if (!newFile.type.match('image.*')) {
      message.textContent = 'The selected file does not appear to be an image.'
      return
    }

    const reader = new FileReader()
    reader.addEventListener('load', (event) => {
      img.src = event.target.result
      image.value = img.src
      button.dataset.updated = true
    })
    reader.readAsDataURL(newFile)
  })

  // click through to the <input type="file">
  file.click()
}

const dialogs = document.getElementById('dialogs')

const watchForImages = () => {
  const imageElements = Array.from(dialogs.querySelectorAll('button.image'))
  console.log('handleImage', imageElements)
  imageElements.forEach((button) => {
    if (offline()) {
      const img = button.firstElementChild
      img.src = NetworkDownIcon
    }
    button.addEventListener('click', handleImage)
  })
}

const observer = new MutationObserver(watchForImages)
observer.observe(dialogs, { subtree: true, childList: true })

export default handleImage
