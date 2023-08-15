import './modals.mjs'
import { apiFetch, elementFromHTML } from './utilities.mjs'
import { Page, Pathname, Title, Api } from './page-info.mjs'
import { collectionHTML, annotateCollection } from './handlers/collection.mjs'

const listAll = async () => {
  const root = document.getElementById('root')
  const action = 'list'
  const pathname = Pathname
  const page = Page
  const title = Title
  const request = { action, pathname, page, title }
  let response = []
  try {
    response = await apiFetch(Api, request)
  } catch (error) {
    console.error('listAll', error)
    response = []
  }
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
