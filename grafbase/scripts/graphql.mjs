import 'dotenv/config'
import process from 'node:process'
import endpoint from './endpoint.mjs'
import { inspect, edgesToData } from './utilities.mjs'
import analyse from './analyse.mjs'

const graphql = async (query, variables = null) => {
  const body = variables ? { query, variables } : { query }

  try {
    const request = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': `${process.env.ROA_GRAFBASE_API}`,
      },
      body: JSON.stringify(body),
    }

    let response = await fetch(endpoint, request)

    if (response.ok) {
      const { data, errors } = await response.json()

      console.warn({ data, errors })
      // if we got errors let the application deal with it
      if (errors) throw Error(`db failed`, { cause: analyse(errors) })
      // console.warn({ data, errors })

      const key = Object.keys(data)[0]
      if (data && data[key]) {
        if (key.endsWith('Collection')) return edgesToData(data[key])

        if (key.endsWith('Update'))
          return edgesToData(Object.values(data[key])[0])

        if (key.endsWith('Create'))
          return edgesToData(Object.values(data[key])[0])

        if (key.endsWith('Delete')) return data[key].deletedId
        if (key.endsWith('DeleteMany')) return data[key].deletedIds

        return edgesToData(Object.values(data)[0])
      }

      throw new Error(`db object not found`, { cause: request })
    }

    // a network error occurred

    throw new Error(response.statusText)
  } catch (error) {
    console.error(inspect(error))
    throw error
  }
}

export default graphql
