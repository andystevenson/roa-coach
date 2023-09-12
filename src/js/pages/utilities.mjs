import spinner from '../utilities/spinner.mjs'

export const headers = { 'content-type': 'application/json' }

export const apiFetch = async (url, body = null, method = 'POST') => {
  try {
    spinner.on()
    const response = body
      ? await fetch(url, {
          method,
          headers,
          body: JSON.stringify(body),
        })
      : await fetch(url)

    if (response.ok) {
      spinner.off()
      return await response.json()
    }
    const dbFailed = response
    const dbFailedBody = await response.json()
    console.warn({ dbFailed, dbFailedBody })
    throw new Error(dbFailedBody.message, { cause: dbFailedBody })
  } catch (error) {
    spinner.off()
    throw error
  }
}

export const formattedName = (name) => {
  const nameRegex = /(^\w{1})|(\s+\w{1})|(-\w{1})/g
  return name.replace(nameRegex, (letter) => letter.toUpperCase())
}
