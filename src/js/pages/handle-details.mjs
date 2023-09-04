import pluralize from 'pluralize'
import { elementFromHTML, apiFetch } from './utilities.mjs'
import { detailHTML } from './handlers/collection.mjs'
import { Api } from './page-info.mjs'

const InputTypeTextSelectable = [
  'text',
  'search',
  'URL',
  'tel',
  'password',
  'textarea',
]

class HandleDetails {
  constructor(types, inputs) {
    console.log('class HandleDetails', types, inputs)
    this.types = types
    this.inputs = inputs
    this.type = pluralize.singular(types)
    this.setAddListener()
  }

  inputElements(container) {
    return Array.from(container.querySelectorAll('input,textarea,select'))
  }

  firstInput(container) {
    const first = container.querySelector('input,textarea,select')
    return first
  }

  focusFirstInput(e) {
    const self = e.target
    const first = this.firstInput(self)
    console.log('focusFirstInput', self, first)

    if (first && InputTypeTextSelectable.includes(first.type)) {
      first.selectionStart = 2048
      first.selectionEnd = 2048
      // focuseses input to the end of the text
    }
    first?.focus()
  }

  fillInputs(section, object = null) {
    const filledInputs = structuredClone(this.inputs)

    for (const input of filledInputs) {
      const { model, property } = input
      if (object) {
        const { id } = object
        input.name = `ignore.${id}.${property}`
        input.value = object[property]
        continue
      }

      // name simply
      const nth = section.children.length
      input.name = `${model}.${nth}.${property}`
    }
    return filledInputs
  }

  setAddListener() {
    const details = Array.from(
      document.querySelectorAll(`[id$="-modal-${this.types}"]`),
    )
    // cater for both create & update modals
    console.log('details', details)

    for (const detail of details) {
      console.log('setAddHandler', detail, this.types, this.add)
      detail?.addEventListener('toggle', this.db.bind(this))
      const add = detail?.querySelector('button')
      add?.addEventListener('click', this.add.bind(this))
    }
  }

  eventListeners(element) {
    const details = element.querySelector('details')
    const deleteButton = details.nextElementSibling

    deleteButton.addEventListener('click', this.delete.bind(this))
    details.addEventListener('toggle', this.focusFirstInput.bind(this))

    const inputs = this.inputElements(details)
    inputs.forEach((input) =>
      input.addEventListener('input', this.editor.bind(this)),
    )
  }

  add(e) {
    const button = e.target.closest('button')
    const detail = button.closest('details')
    const section = detail?.querySelector('section')

    const summary = this.type
    const inputs = this.fillInputs(section)
    const newElement = elementFromHTML(detailHTML({ summary, inputs }))
    this.eventListeners(newElement)

    section?.appendChild(newElement)
    newElement.scrollIntoView()
    newElement.focus()
  }

  addExisting(fetched) {
    // called in an update modal

    const types = this.types
    console.log('addExisting', fetched)
    const detail = document.querySelector(
      `[id$="update-modal-${types}-detail"]`,
    )

    // existing type can go through a lifecycle once they are read back from the object
    // type => ignore => edited => deleted
    // 'type' => is a brand new type and created in an update
    // 'ignore' types are pruned from any update request as they have not been altered
    // 'edited' types are sent in an update request
    // 'deleted' types are sent to the server and physically deleted

    for (const element of fetched) {
      const summary = this.type
      const inputs = this.fillInputs(null, element)
      const newElement = elementFromHTML(detailHTML({ summary, inputs }))
      this.eventListeners(newElement)
      detail.appendChild(newElement)
    }
  }

  delete(e) {
    const self = e.target
    const button = self.closest('button')
    const container = button.closest('section')
    const details = container.querySelector('details')

    const inputs = this.inputElements(details)
    let name = inputs[0].name

    // a newly created element can simply be deleted
    if (name.startsWith(`${this.type}.`)) return container.remove()

    // any other type of elemnent needs to be marked as deleted and hidden
    inputs.forEach((input) => {
      name = input.name
      const deletedName = `deleted.${name.split('.').slice(1).join('.')}`
      input.name = deletedName
    })

    container.style.display = 'none'
  }

  editor(e) {
    console.log('editor', this.type)
    const self = e.target
    const name = self.name
    if (!name.startsWith(`${this.type}.`) && !name.startsWith('edited.')) {
      const newName = `edited.${name.split('.').slice(1).join('.')}`
      self.name = newName
    }
  }

  async db(e) {
    // read the form data for notes.
    const details = e.target
    const open = details.open
    const closed = !open
    const types = this.types

    // details is opening or closing
    const runningIn = details.closest(`[id$="-modal-${types}"]`)
    const modalType = runningIn.id.split('-')[0]
    console.log('running db....', { details, runningIn, modalType })
    if (modalType === 'create') return

    console.log('db', types, 'on', Api)
    try {
      const form = runningIn.closest('form')
      const request = Object.fromEntries(new FormData(form).entries())
      const id = form.dataset.id

      request.action = types
      request.id = id

      if (open) {
        // fill in the details of what was read back
        request.subaction = 'list'
        const response = await apiFetch(Api, request)
        this.addExisting(response[types])
        console.log('db filling in...', { request, response })
        return
      }

      if (closed) {
        const contents = details.querySelector(`[id$="-modal-${types}-detail"]`)
        const updateRequired = contents.children.length > 0
        console.log('db closed', {
          updateRequired,
          form,
          request,
        })
        if (updateRequired) {
          const response = await apiFetch(Api, request)
          console.log('updated...', { response })
        }
        // clear the contents
        contents && (contents.innerHTML = '')
      }
    } catch (error) {
      console.error('dbAction failed', { error })
    }
  }
}

export default HandleDetails
