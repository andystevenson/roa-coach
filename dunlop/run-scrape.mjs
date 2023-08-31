import { writeFileSync } from 'fs'
import scrapeAll from './scrape.mjs'

const run = async () => {
  const dunlop = await scrapeAll()
  writeFileSync('./public/dunlop.json', JSON.stringify(dunlop))
}

run()
