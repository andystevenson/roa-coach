import { Pathname, Page, Title, Api } from './page-info.mjs'
import {
  DefaultImage,
  DefaultPortrait,
  DefaultThumbnail,
} from './handle-image.mjs'

export const layout = (type) => {
  const name = `${type}-modal`

  const Elements = {
    type,
    page: Page,
    pathname: Pathname,
    collection: Page,
    object: Title,
    api: Api,
    method: type === 'update' ? 'PUT' : 'POST',
    root: document.getElementById('root'),
    create: document.getElementById('create'), // special case of Page level add
    modal: document.getElementById(name),
    title: document.getElementById(`${name}-title`),
    close: document.getElementById(`${name}-close`),
    form: document.getElementById(`${name}-form`),
    error: document.getElementById(`${name}-error`),
    cancel: document.getElementById(`${name}-cancel`),
    delete: document.getElementById(`${name}-delete`),
    submit: document.getElementById(`${name}-submit`),
  }

  // optional image elements
  const imageName = `${name}-image`
  const ImageElements = {
    type,
    default: DefaultImage,
    portrait: DefaultPortrait,
    thumbnail: DefaultThumbnail,
    image: document.getElementById(imageName),
    selector: document.getElementById(`${imageName}-selector`),
    status: document.getElementById(`${imageName}-status`),
    img: document.getElementById(`${imageName}-img`),
  }

  console.log({ Elements, ImageElements })
  let LayoutExpected = Object.values(Elements).every((element) => element)

  if (!LayoutExpected) {
    console.error(`${name} layout unexpected!`)
  }

  LayoutExpected = Object.values(ImageElements).every((element) => element)

  if (ImageElements.image && !LayoutExpected) {
    console.error(`${imageName} layout unexpected`)
  }

  return { Elements, ImageElements }
}

export default layout
