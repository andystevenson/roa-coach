import pluralize from 'pluralize'
import { detailHTML } from './handlers/collection.mjs'
import { elementFromHTML, apiFetch } from './utilities.mjs'
import { Api } from './page-info.mjs'

const noteEditor = (e) => {
  const textarea = e.target
  const name = textarea.name
  if (!name.startsWith('note.') && !name.startsWith('edited.')) {
    const newName = `edited.${name.split('.').slice(1).join('.')}`
    textarea.name = newName
  }
  const summary = textarea.previousElementSibling
  const text = textarea.value
  let summaryTitle = text.length ? text.slice(0, 55) : 'note'
  if (text.length > summaryTitle.length) summaryTitle = summaryTitle + '...'
  summary.textContent = summaryTitle
  // console.log('noteEditor', { textarea, summary })
}

const InputTypeTextSelectable = [
  'text',
  'search',
  'URL',
  'tel',
  'password',
  'textarea',
]

const focusFirstInput = (e) => {
  const first = e.target.querySelector('input,textarea,select')
  console.log('focusFirstInput', first, first.type)
  if (InputTypeTextSelectable.includes(first.type)) {
    first.selectionStart = 2048
    first.selectionEnd = 2048
    // focuseses input to the end of the text
  }
  first?.focus()
}

const deleteNote = (e) => {
  const button = e.target.closest('button')
  const container = button.closest('section')
  const textarea = container.querySelector('textarea')
  const name = textarea.name
  console.log('deleteNote', { button, container, textarea, name })

  // a newly created note can simply be deleted
  if (name.startsWith('note.')) return container.remove()
  // any other type of note needs to be marked as deleted and hidden
  const deletedName = `deleted.${name.split('.').slice(1).join('.')}`
  textarea.name = deletedName
  textarea.value = ''
  container.style.display = 'none'
}

const addEventHandlers = (newNote) => {
  const newNoteDetails = newNote.querySelector('details')
  const newNoteDeleteButton = newNoteDetails.nextElementSibling
  newNoteDeleteButton.addEventListener('click', deleteNote)
  newNoteDetails.addEventListener('toggle', focusFirstInput)
  const textarea = newNote.querySelector('textarea')
  textarea?.addEventListener('input', noteEditor)
}

const fillInputs = (inputs, section, object = null) => {
  for (const input of inputs) {
    const { model, property } = input
    if (object) {
      const { id, note } = object
      input.name = `ignore.${id}.${property}`
      input.value = note
      continue
    }

    // name simply
    const nth = section.children.length
    input.name = `${model}.${nth}.${property}`
  }
  return inputs
}

export const handleNotes = (types) => {
  const type = pluralize.singular(types)
  const inputs = [{ model: type, property: 'note', type: 'textarea' }]

  const add = (e) => {
    const button = e.target.closest('button')
    const detail = button.closest('details')
    const section = detail?.querySelector('section')

    const filledInputs = structuredClone(inputs)
    const newElement = elementFromHTML(
      detailHTML({ summary: type, inputs: fillInputs(filledInputs, section) }),
    )
    addEventHandlers(newElement)

    section?.appendChild(newElement)
    newElement.scrollIntoView()
    newElement.focus()
  }

  const addExistingNotes = (fetchedNotes) => {
    // called in an update modal
    console.log('addExistingNotes', fetchedNotes)
    const notes = document.querySelector(`[id$="update-modal-notes-detail"]`)

    // existing notes can go through a lifecycle once they are read back from the object
    // note => ignore => edited => deleted
    // 'note' => is a brand new note and created in an update
    // 'ignore' notes are pruned from any update request as they have not been altered
    // 'edited' notes are sent in an update request
    // 'deleted' notes are sent to the server and physically deleted
    for (const fetchedNote of fetchedNotes) {
      const { note } = fetchedNote
      const filledInputs = structuredClone(inputs)
      const newElement = elementFromHTML(
        detailHTML({
          summary: note.slice(0, 55) + '...',
          inputs: fillInputs(filledInputs, null, fetchedNote),
        }),
      )
      addEventHandlers(newElement)
      notes.appendChild(newElement)
    }
  }

  const dbAction = async (e) => {
    // read the form data for notes.
    const details = e.target
    const open = details.open
    const closed = !open
    // details is opening or closing
    const runningIn = details.closest(`[id$="-modal-${types}"]`)
    const modalType = runningIn.id.split('-')[0]
    console.log('running dbAction....', { details, runningIn, modalType })
    if (modalType === 'create') return
    console.log('dbAction', types, 'on', Api)
    try {
      const form = runningIn.closest('form')
      const request = Object.fromEntries(new FormData(form).entries())
      const id = form.dataset.id

      request.action = types
      request.id = id
      const contents = details.querySelector(`[id$="-modal-${types}-detail"]`)

      if (open) {
        // fill in the details of what was read back
        const response = await apiFetch(Api, request)
        addExistingNotes(response.notes)
        console.log('dbAction filling in...', { request, response })
        return
      }

      if (closed) {
        const updateRequired = contents.children.length > 0
        console.log('dbAction closed', {
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

  const setAddHandler = (handler) => {
    const details = Array.from(
      document.querySelectorAll(`[id$="-modal-${types}"]`),
    )
    // cater for both create & update modals

    for (const element of details) {
      console.log('setAddHandler', { element, types, handler })
      element?.addEventListener('toggle', dbAction)
      const add = element?.querySelector('button')
      add?.addEventListener('click', handler)
    }
  }

  setAddHandler(add)
}
