import './modals.mjs'
import { apiFetch, elementFromHTML } from './utilities.mjs'
import { Page, Pathname, Title, Api } from './page-info.mjs'
import { collectionHTML, annotateCollection } from './handlers/collection.mjs'

const listAll = async () => {
  const root = document.getElementById('root')
  const first = root?.firstElementChild
  console.log({ first })
  console.warn({ Pathname, Page, Title })
  const action = 'list'
  const pathname = Pathname
  const page = Page
  const title = Title
  const request = { action, pathname, page, title }
  let response = []
  try {
    console.warn('pre apiFetch', { response })
    response = await apiFetch(Api, request)
    console.warn('post apiFetch', { response })
  } catch (error) {
    console.error('listAll', error)
    response = []
  }
  console.warn('listAll !!!', response)
  const collection = Page
  const object = Title
  root.appendChild(
    elementFromHTML(
      collectionHTML(
        annotateCollection(response, collection, object),
        collection,
      ),
    ),
  )
}

listAll()
