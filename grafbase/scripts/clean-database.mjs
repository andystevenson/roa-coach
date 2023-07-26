import 'dotenv/config'
import { log } from 'node:console'
import process from 'node:process'

log('clean-database')

const cleanAll = () => {}

const listAttendeePayments = async () => {}

const graphql = async (query, variables = null) => {
  const body = variables ? { query, variables } : { query }

  try {
    const response = fetch(process.env.ROA_GRAFBASE, {
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
