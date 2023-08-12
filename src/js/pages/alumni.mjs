import './modals.mjs'
import { apiFetch, elementFromHTML } from './utilities.mjs'
import { Page, Pathname, Title, Api } from './page-info.mjs'
import { alumniHTML } from './handlers/alumni.mjs'

const listAll = async () => {
  const root = document.getElementById('root')
  console.warn({ Page })
  const action = 'list'
  const pathname = Pathname
  const page = Page
  const title = Title
  const request = { action, pathname, page, title }
  const response = await apiFetch(Api, request)
  console.warn('listAll', response)
  root.appendChild(elementFromHTML(alumniHTML(response)))
}

listAll()
