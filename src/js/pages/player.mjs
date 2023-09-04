import page from './page.mjs'

import HandleNotes from './handle-notes.mjs'

const run = async () => {
  await page({ notes: HandleNotes })
}

run()
