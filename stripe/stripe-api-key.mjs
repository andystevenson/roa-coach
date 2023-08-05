import 'dotenv/config'
import process, { exit } from 'node:process'

export const key =
  process.env.ROA_STRIPE_TEST_SECRET_KEY || process.env.ROA_STRIPE_SECRET_KEY

if (key) {
  if (key === process.env.ROA_STRIPE_SECRET_KEY)
    console.warn(`<<< STRIPE RUNNING IN PRODUCTION >>>`)

  if (key === process.env.ROA_STRIPE_TEST_SECRET_KEY)
    console.warn(`<<< STRIPE RUNNING IN TEST MODE >>>`)
}

if (!key) {
  console.error('NO ROA STRIPE KEY!!')
  exit(1)
}

export default key
