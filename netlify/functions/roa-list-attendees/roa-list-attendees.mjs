import { listAttendees } from '../../../grafbase/scripts/programmes.mjs'

const name = 'roa-list-attendees'

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

    const attendees = await listAttendees(programme)
    console.log(`${name} success`, attendees)

    return {
      statusCode: 200,
      body: JSON.stringify(attendees),
    }
  } catch (error) {
    console.error(`${name} failed`, error)
    return { statusCode: 500, body: error.toString() }
  }
}

export { handler }
