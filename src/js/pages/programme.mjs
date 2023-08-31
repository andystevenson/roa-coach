import page from './page.mjs'

import { handleNotes } from './handle-notes.mjs'

const run = async () => {
  await page({ notes: handleNotes })
}

run()
