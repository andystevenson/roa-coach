import { listSessions } from '../../../grafbase/scripts/programmes.mjs'

const handler = async (event) => {
  try {
    const programme = event.queryStringParameters.programme
    if (!programme)
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'programme name expected' }),
      }

    const sessions = await listSessions(programme)

    return {
      statusCode: 200,
      body: JSON.stringify(sessions),
    }
  } catch (error) {
    return { statusCode: 500, body: error.toString() }
  }
}

export { handler }
