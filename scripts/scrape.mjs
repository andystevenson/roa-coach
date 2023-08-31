import { writeFileSync } from 'fs'
import { default as dunlop } from '../dunlop/scrape.mjs'
import { default as iprosports } from '../iprosports/scrape.mjs'

const scrape = async () => {
  try {
    const all = await Promise.all([iprosports(), dunlop()])
    writeFileSync('./public/scrape.json', JSON.stringify(all))
  } catch (error) {
    console.error('scrape failed', error)
  }
}
scrape()
