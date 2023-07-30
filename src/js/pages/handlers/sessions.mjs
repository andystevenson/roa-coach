import dayjs from 'dayjs'
import { deleteDetails, apiFetch, elementFromHTML } from '../utilities.mjs'
import { coachesHTML } from './coaches.mjs'
import { attendeesHTML } from './attendees.mjs'

export const sessionHTML = (session) => {
  const { id, date, start, end, attendees, hosts } = session
  const startTime = dayjs(start).format('HH:mm')
  const endTime = dayjs(end).format('HH:mm')
  const sessionAttendeesHTML = attendeesHTML(attendees)
  const sessionHostsHTML = coachesHTML(hosts)
  const html = `
  <span id="${id}">${date}</span>
  <span>${startTime}</span>
  <span>${endTime}</span>
  <details class="attendees">
    <summary>attendees</summary>
    ${sessionAttendeesHTML}
  </details>
  <details class="coaches">
    <summary>hosts</summary>
    ${sessionHostsHTML}
  </details>
  `
  return html
}

export const sessionsHTML = (sessions) => {
  const header = `
    <span>date</span>
    <span>start</span>
    <span>end</span>
    <span>attendees</span>
    <span>hosts</span>`

  const html = `<section>${header}${sessions
    .map((session) => sessionHTML(session))
    .join('')}</section>`

  return html
}

export const handleSessions = async (e) => {
  const element = e.target
  const open = element.open
  const programmeElement = element.closest('.programme')
  const pid = programmeElement.dataset.id
  const programme = programmeElement.id
  const params = new URLSearchParams({ programme })

  // refresh data
  deleteDetails(element)

  if (open) {
    const url = `/api/roa-list-sessions?${params}`
    const sessions = await apiFetch(url)
    console.log(element, 'fired', programme, pid, url, sessions, element.open)
    if (sessions && sessions.length) {
      const html = elementFromHTML(sessionsHTML(sessions))
      element.appendChild(html)
    }
    return
  }
}
