export const headers = { 'content-type': 'application/json' }
export const apiFetch = async (url, body = null) => {
  try {
    console.log({ url, body }, !body)
    const response = body
      ? await fetch(url, { headers, body: JSON.stringify(body) })
      : await fetch(url)

    if (response.ok) {
      return await response.json()
    }
    throw Error(response.statusText)
  } catch (error) {
    console.error(`apiFetch failed [${error}]`)
  }
}

export const deleteDetails = (element) =>
  element.querySelectorAll('section').forEach((section) => section.remove())

export const setListeners = (className, handler) => {
  const elements = document.querySelectorAll(className)
  elements.forEach((programme) => programme.addEventListener('toggle', handler))
}

export const elementFromHTML = (html) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  return doc.querySelector('section')
}
