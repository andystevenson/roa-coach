import { handleAttendees } from './handlers/attendees.mjs'
import { handleCoaches } from './handlers/coaches.mjs'
import { handleSessions } from './handlers/sessions.mjs'
import { setListeners } from './utilities.mjs'
import { apiFetch } from './utilities.mjs'

const Root = document.getElementById('programmes-root')

const listProgrammes = async () => {
  return await apiFetch('/api/roa-list-programmes')
}

const Details = {
  attendees: { handler: handleAttendees },
  coaches: { handler: handleCoaches },
  sessions: { handler: handleSessions },
  dates: {},
}

console.log('programme page')
const programmesHTML = (programmes) => {
  const details = []
  for (const programme of programmes) {
    console.log(programme, 'details')
    const { id, name } = programme

    const all = Object.keys(Details)
      .map(
        (detail) =>
          `<details class="${detail}"><summary>${detail}</summary></details>`,
      )
      .join('')

    const template = `
    <details class="programme" id="${name}" data-id="${id}">
      <summary><span>${name}</span></summary>
      ${all}
    </details>`
    details.push(template)
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(
    `<section class="programme">${details.join('')}</section>`,
    'text/html',
  )
  Root.replaceWith(doc.querySelector('section'))
}

const init = async () => {
  console.log('programmes page')
  programmesHTML(await listProgrammes())
  for (const detail in Details) {
    const handler = Details[detail].handler
    if (handler) setListeners(`.${detail}`, handler)
  }
}

await init()

// await init()
