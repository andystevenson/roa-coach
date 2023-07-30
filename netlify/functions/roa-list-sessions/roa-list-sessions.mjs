import { listSessions } from '../../../grafbase/scripts/programmes.mjs'

const name = 'roa-list-sessions'
const handler = async (event) => {
  try {
    const programme = event.queryStringParameters.programme
    if (!programme) {
      const error = { error: 'programme name expected' }
      console.error(`${name} failed`, error)
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'programme name expected' }),
      }
    }

    const sessions = await listSessions(programme)
    console.error(`${name} success`, sessions)

    return {
      statusCode: 200,
      body: JSON.stringify(sessions),
    }
  } catch (error) {
    console.error(`${name} failed`, error)
    return { statusCode: 500, body: error.toString() }
  }
}

export { handler }
