import { formattedName } from '../utilities.mjs'

export const objectHTML = (record) => {
  const { object, id, name, image } = record
  const fName = formattedName(name)
  const html = `
  <section class="${object} object" id=${id}>
    <button type="button" class="action">
      <img src=${image} alt="ROA ${object} ${fName}">
      <h3>${fName}</h3>
    </button>
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
  console.log('annotateCollection', { records, collection, object })
  records.forEach((record) => {
    record.collection = collection
    record.object = object
  })
  return records
}
