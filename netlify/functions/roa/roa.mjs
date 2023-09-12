import 'dotenv/config'
import client from '../../../grafbase/src/GrafbaseClient.mjs'
import '../../../grafbase/src/GrafbaseEvents.mjs'

const Headers = { 'Content-Type': 'application/json' }
const FunctionName = 'roa-player'

const Allow = `POST,PUT,DELETE`
const validateAction = (method, action) => {
  if (method === 'DELETE' && action === 'delete') return true
  if (method === 'PUT' && action === 'update') return true
  if (method === 'POST') return true
  return false
}

const handleRequest = async (request) => {
  try {
    const { httpMethod, body } = request
    const allowed = Allow.includes(httpMethod)
    if (!allowed) {
      const error = { name: FunctionName, 'method-not-allowed': httpMethod }
      return {
        statusCode: 405,
        headers: { Allow, ...Headers },
        body: JSON.stringify(error),
      }
    }

    const requestBody = JSON.parse(body)
    const { action } = requestBody
    // console.log({ requestBody })
    let validAction = validateAction(httpMethod, action)

    if (!validAction) {
      const error = { name: FunctionName, 'invalid-action': httpMethod }
      return {
        statusCode: 400,
        headers: { ...Headers },
        body: JSON.stringify(error),
      }
    }

    // okay we're good to go
    const response = await client.invoke(requestBody)
    // console.log(`${action}`, requestBody)

    return {
      statusCode: action === 'create' ? 201 : 200,
      Headers,
      body: JSON.stringify(response),
    }
  } catch (error) {
    // this is an application error
    const { message, cause } = error
    return {
      statusCode: 400,
      Headers,
      body: JSON.stringify({
        message,
        ...cause,
      }),
    }
  }
}

const handler = async (request) => {
  try {
    return await handleRequest(request)
  } catch (error) {
    return {
      statusCode: 500,
      Headers,
      body: JSON.stringify({
        message: error.message,
        error: 'something unexpected went wrong',
      }),
    }
  }
}

export { handler }
