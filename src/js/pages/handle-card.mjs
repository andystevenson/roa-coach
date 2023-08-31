// handle membership card lookup

import getCard from '../utilities/getCard.mjs'
import debounce from 'lodash.debounce'

const updateForm = (input, card) => {
  const form = input.closest('form')
  const [member, name, status, email, age, mobile, dob] = card
  const elements = {
    name: form.querySelector('[name="name"]'),
    email: form.querySelector('[name="email"]'),
    mobile: form.querySelector('[name="mobile"]'),
    dob: form.querySelector('[name="dob"]'),
    member: form.querySelector('[name="member"]'),
  }

  // only update the fields if they havent already been populated
  for (const property in elements) {
    const input = elements[property]
    const value = input?.value
    if (input) {
      if (property === 'name' && !value && name)
        input.value = name.trim().replace(/\s+/g, ' ')
      if (property === 'email' && !value && email)
        input.value = email.trim().replace(/\s/g, '')
      if (property === 'mobile' && !value && mobile)
        input.value = mobile.trim().replace(/\s/g, '')
      if (property === 'dob' && !value && dob) {
        const [day, month, year] = dob.split('/')
        input.value = `${year}-${month}-${day}`
      }
      if (property === 'member') {
        input.value = member
      }
    }
  }
}

const fetchCard = async (e) => {
  const input = e.target
  const value = input.value.trim().replace(/\s/g, '')
  console.log('fetchCard', { input, value })

  const card = await getCard(value)
  if (card.found) {
    const [member] = card.found
    if (member) {
      updateForm(input, card.found)
      // clear the :invalid

      input.setCustomValidity('')
      return
    }
  } else {
    updateForm(input, [false])
  }

  // the membership card is invalid
  if (!value) {
    input.value = value
    return input.setCustomValidity('')
  }
  input.setCustomValidity('invalid membership card')
}

const cardInput = debounce(fetchCard, 200)

const handleCard = () => {
  const cardElements = Array.from(document.querySelectorAll('[name="card"]'))
  console.log('handleCard', cardElements)
  cardElements.forEach((card) => {
    card.addEventListener('input', cardInput)
  })
}

export default handleCard

handleCard()
