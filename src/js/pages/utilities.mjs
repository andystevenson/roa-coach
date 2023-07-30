import spinner from '../utilities/spinner.mjs'
export const headers = { 'content-type': 'application/json' }
export const apiFetch = async (url, body = null) => {
  try {
    spinner.on()
    const response = body
      ? await fetch(url, { headers, body: JSON.stringify(body) })
      : await fetch(url)

    if (response.ok) {
      spinner.off()
      return await response.json()
    }
    throw Error(response.statusText)
  } catch (error) {
    spinner.off()
    console.error(`apiFetch failed [${error}]`)
    throw error
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
