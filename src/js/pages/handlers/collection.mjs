import { formattedName } from '../utilities.mjs'

export const objectHTML = (record) => {
  const { object, id, name, email, mobile, bio, image, psa, thumbnail } = record

  const fName = formattedName(name)
  const fEmail = email ? email : ''
  const mailto = `mailto:${fEmail}?Subject=Rob Owen Academy`
  const fMobile = mobile ? mobile : ''
  const tel = `tel:${fMobile}`

  const html = `
  <section class="${object} object" name="${name}" id=${id}>
    <button type="button" class="update-action">
      <img src=${image} alt="ROA ${object} ${fName}">
      <h3>${fName}</h3>
    </button>
    <section class="object-details">
      <img class="thumbnail update-action" src="${thumbnail}">
      <span class="name update-action">${fName}</span>
      <p class="email"><a href="${mailto}">${fEmail}</a></p>
      <p class="mobile"><a href="${tel}">${fMobile}</a></p>
      <a class="psa" href="${psa}" target="_blank"><img src="/images/PSA.avif"></a>
      <details class="bio">
        <summary>bio</summary>
        <p>${bio ? bio : ''}</p>
      </details>

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
  const html = records.map((alumnus) => objectHTML(alumnus)).join('')
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
