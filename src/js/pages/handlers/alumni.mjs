export const alumnusHTML = (alumnus) => {
  const { id, name, image } = alumnus
  const html = `
  <section class="alumnus" id=${id}>
    <button type="button" class="action">
      <img src=${image} alt="ROA alumnus ${name}">
      <h3>${name}</h3>
    </button>
  </section>`
  return html
}

export const alumniHTML = (alumni) => {
  const html = alumni.map((alumnus) => alumnusHTML(alumnus)).join('')
  return `<section class="alumni media-scroller">${html}</section>`
}
