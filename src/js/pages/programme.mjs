import page from './page.mjs'

import HandleNotes from './handle-notes.mjs'
import HandleDates from './handle-dates.mjs'
import HandlePrices from './handle-prices.mjs'

const run = async () => {
  await page({ notes: HandleNotes, dates: HandleDates, prices: HandlePrices })
}

run()
