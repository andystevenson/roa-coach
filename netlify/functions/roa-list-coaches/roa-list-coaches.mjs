import { listCoaches } from '../../../grafbase/scripts/programmes.mjs'

const name = 'roa-list-coaches'
const handler = async (event) => {
  try {
    const programme = event.queryStringParameters.programme
    if (!programme) {
      const error = { error: 'programme name expected' }
      console.error(`${name} failed`, error)
      return {
        statusCode: 400,
        body: JSON.stringify(error),
      }
    }

    const coaches = await listCoaches(programme)
    console.log(`${name} succeeded`, coaches)

    return {
      statusCode: 200,
      body: JSON.stringify(coaches),
    }
  } catch (error) {
    console.error(`${name} failed`, error)
    return { statusCode: 500, body: error.toString() }
  }
}

export { handler }
