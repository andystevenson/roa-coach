import 'dotenv/config'
import process, { exit } from 'node:process'

export const endpoint =
  process.env.ROA_GRAFBASE_LOCAL || process.env.ROA_GRAFBASE

if (endpoint) {
  if (endpoint === process.env.ROA_GRAFBASE)
    console.warn(`<<< GRAFBASE RUNNING IN PRODUCTION ON ${endpoint}>>>`)

  if (endpoint === process.env.ROA_GRAFBASE_LOCAL)
    console.warn(`<<< GRAFBASE RUNNING LOCALLY ON ${endpoint}>>>`)
}

if (!endpoint) {
  console.error('NO ROA GRAFBASE ENDPOINT!!')
  exit(1)
}

export default endpoint
