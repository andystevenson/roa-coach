// import { default as dunlop } from '../../../dunlop/scrape.mjs'
// import { default as iprosports } from '../../../iprosports/scrape.mjs'
import scrape from '../../../public/scrape.json' assert { type: 'json' }
import { readFileSync } from 'fs'

const handler = async () => {
  try {
    return {
      statusCode: 200,
      body: JSON.stringify(scrape),
      headers: { 'content-type': 'application/json' },
    }
  } catch (error) {
    return { statusCode: 500, body: error.toString() }
  }
}

export { handler }
