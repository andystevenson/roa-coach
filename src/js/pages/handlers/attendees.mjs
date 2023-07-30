import dayjs from 'dayjs'
import { deleteDetails, apiFetch, elementFromHTML } from '../utilities.mjs'
import { ordinalDateTime } from '../../../../grafbase/scripts/dates.mjs'

export const attendeeHTML = (attendee) => {
  const { id, name, email, mobile, member, payment } = attendee

  let paid = `not-paid`
  let paymentDetails = ''
  if (payment) {
    paid = 'paid'
    const { id: paymentId, booking, price, unitPrice, quantity, time } = payment

    // TODO: ordinalDateTime
    paymentDetails = `<section class='payment' id=${paymentId} data-booking="${booking}" title="${booking}">
                        <span>paid-price</span><span>£${price}</span>
                        <span>unit-price</span><span>£${unitPrice}</span>
                        <span>quantity</span><span>${quantity}</span>
                        <span>time</span><span>${ordinalDateTime(
                          dayjs(time),
                        )}</span>
                      </section>`
  }

  const html = `
  <span id="${id}">${name}</span>
  <span><a href="mailto:${email}" title="email ${email}">${email}</a></span>
  <span><a href="tel:${mobile}" title="call ${mobile}">${mobile}</a></span>
  <span>${member}</span>
  <details>
    <summary>${paid}</summary>
    ${paymentDetails}
  </details>
  `

  return html
}

export const attendeesHTML = (attendees) => {
  const header = `
    <span>name</span>
    <span>email</span>
    <span>mobile</span>
    <span>member</span>
    <span>payment</span>`

  const html = `<section>${header}${attendees
    .map((attendee) => attendeeHTML(attendee))
    .join('')}</section>`

  return html
}

export const handleAttendees = async (e) => {
  const element = e.target
  const open = element.open
  const programmeElement = element.closest('.programme')
  const pid = programmeElement.dataset.id
  const programme = programmeElement.id
  const params = new URLSearchParams({ programme })

  // refresh data
  deleteDetails(element)

  if (open) {
    const url = `/api/roa-list-attendees?${params}`
    const attendees = await apiFetch(url)
    console.log(element, 'fired', programme, pid, url, attendees, element.open)
    if (attendees && attendees.length) {
      const html = elementFromHTML(attendeesHTML(attendees))
      element.appendChild(html)
    }
    return
  }
}
