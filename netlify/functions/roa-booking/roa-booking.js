const process = require('process')
require('dotenv').config()
let statusCode = 200
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const handler = async (event) => {
  try {
    // -- We only care to do anything if this is our POST request.
    if (event.httpMethod !== 'POST' || !event.body) {
      statusCode = 400
      return {
        statusCode,
        headers,
        body: '',
      }
    }

    // -- Parse the body contents into an object.
    const body = JSON.parse(event.body)
    console.log(body)

    return {
      statusCode,
      body: JSON.stringify({ message: `booking received` }),
    }
  } catch (error) {
    statusCode = 500
    return { statusCode, body: error.toString() }
  }
}

module.exports = { handler }
