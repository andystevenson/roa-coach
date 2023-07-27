import 'dotenv/config'
import process from 'node:process'

const graphql = async (query, variables = null) => {
  const body = variables ? { query, variables } : { query }

  try {
    const response = await fetch(process.env.ROA_GRAFBASE, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': `${process.env.ROA_GRAFBASE_API}`,
      },
      body: JSON.stringify(body),
    })

    if (response.ok) return await response.json()

    throw Error(response.statusText)
  } catch (error) {
    console.error(error)
  }
}

export default graphql
