import { formattedName } from '../utilities.mjs'

export const objectHTML = (record) => {
  const { object, id, name, email, mobile, bio, image, psa, thumbnail } = record

  const fName = formattedName(name)
  const fEmail = email ? email : ''
  const mailto = `mailto:${fEmail}?Subject=Rob Owen Academy`
  const fMobile = mobile ? mobile : ''
  const tel = `tel:${fMobile}`
  const fPsa = psa ? psa : ''
  const srcPsa = fPsa ? '<img src="/images/PSA.avif">' : ''
  const fBio =
    bio || psa
      ? `<details class="bio">
        <summary>bio</summary>
        <p>${bio ? bio : ''}</p>
      </details>`
      : `<p></p>`

  const html = `
  <section class="${object} object" name="${name}" id=${id}>
    <button type="button" class="update-action">
      <img src=${image} alt="ROA ${object} ${fName}" loading="lazy">
      <h3>${fName}</h3>
    </button>
    <section class="object-details">
      <img class="thumbnail update-action" src="${thumbnail}" loading="lazy">
      <span class="name update-action">${fName}</span>
      <p class="email"><a href="${mailto}">${fEmail}</a></p>
      <p class="mobile"><a href="${tel}">${fMobile}</a></p>
      <a class="psa" href="${fPsa}" target="_blank">${srcPsa}</a>
      ${fBio}

      <button type="button" class="update-action icon" title="update">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
          <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
        </svg>
      </button>
    </section>
  </section>`
  return html
}

export const collectionHTML = (records, collection) => {
  if (records.length < 1)
    return `<section class="${collection} collection media-scroller"></section>`
  const html = records.map((object) => objectHTML(object)).join('')
  return `<section class="${collection} collection media-scroller">${html}</section>`
}

export const annotateCollection = (records, collection, object) => {
  // console.log('annotateCollection', { records, collection, object })
  records.forEach((record) => {
    record.collection = collection
    record.object = object
  })
  return records
}

const inputsHTML = (inputs) => {
  const html = []
  for (const field of inputs) {
    const { name, type, db, value, placeholder, required } = field
    // format attributes
    let fname = name ? `name="${name}"` : ''
    let ftype = type ? `type="${type}"` : ''
    let fdb = db ? `data-db="${db}"` : ''
    let fplaceholder = placeholder ? `placeholder="${placeholder}"` : ''
    let frequired = required ? `required` : ''
    let fvalue = value ? `value="${value}"` : ''

    console.log({ fname, fdb, fplaceholder, frequired, fvalue })

    let template = null
    if (type === 'textarea') {
      template = `<textarea ${fname} ${ftype} ${fdb} ${fplaceholder} ${frequired}>${
        value ?? ''
      }</textarea>`
    }

    template && html.push(template)
  }

  return html.join('')
}

export const detailHTML = ({ summary, inputs }) => {
  const fields = inputsHTML(inputs)
  const html = `
  <section>
    <details>
      <summary>${summary}</summary>
      ${fields}
    </details>
    <button type="button" class="icon" title="delete note">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
        <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
      </svg>
    </button>
  </section>`
  return html
}
