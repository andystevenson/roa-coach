import { deleteDetails, apiFetch, elementFromHTML } from '../utilities.mjs'

export const coachHTML = (coach) => {
  const { id, name, email, mobile } = coach

  const html = `
  <span id="${id}">${name}</span>
  <span><a href="mailto:${email}" title="email ${email}">${email}</a></span>
  <span><a href="tel:${mobile}" title="call ${mobile}">${mobile}</a></span>
  `
  ;('<a aria-label="email admin@westwarwick.co.uk" href="mailto:admin@westwarwicks.co.uk" alt="email admin@westwarwick.co.uk" title="email admin@westwarwick.co.uk" id="email"><img aria-hidden="true" src="https://images.ctfassets.net/ffrbyg3cfykl/1PAJHMm10h6d0KfktWsZjk/535567565381e972b54e12c7b6380a52/envelope.svg" width="16" height="16" title="envelope icon"></a>')
  return html
}

export const coachesHTML = (coaches) => {
  const header = `
    <span>name</span>
    <span>email</span>
    <span>mobile</span>
    `

  const html = `<section class='coaches'>${header}${coaches
    .map((coach) => coachHTML(coach))
    .join('')}</section>`

  return html
}

export const handleCoaches = async (e) => {
  const element = e.target
  const open = element.open
  const programmeElement = element.closest('.programme')
  const pid = programmeElement.dataset.id
  const programme = programmeElement.id
  const params = new URLSearchParams({ programme })

  // refresh data
  deleteDetails(element)

  if (open) {
    const url = `/api/roa-list-coaches?${params}`
    const coaches = await apiFetch(url)
    console.log(element, 'fired', programme, pid, url, coaches, element.open)
    if (coaches && coaches.length) {
      const html = elementFromHTML(coachesHTML(coaches))
      element.appendChild(html)
    }
    return
  }
}
