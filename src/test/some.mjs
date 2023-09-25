import client from '../grafbase/GrafbaseClient.mjs'
import { inspect } from '../grafbase/utilities.mjs'
import * as T from './templates.mjs'

// HOF to generate a some function
const HOF = ({ type, min: defaultMin, max: defaultMax }) => {
  return async ({ min, max, id, oid } = {}) => {
    if (min === undefined) min = defaultMin
    if (max === undefined) max = defaultMax
    const Type = client.actions[type]
    const many = []
    const some = T[type].some({ min, max, id, oid })

    for (const t of some) {
      const created = await Type.create(t)
      many.push(created)
    }
    return many
  }
}

const coaches = HOF({ type: 'Coach', min: 1, max: 6 })
const programmes = HOF({ type: 'Programme', min: 1, max: 3 })
const players = HOF({ type: 'Player', min: 1, max: 20 })
const sessions = HOF({ type: 'Session', min: 1, max: 4 })
export { coaches, programmes, players, sessions }
