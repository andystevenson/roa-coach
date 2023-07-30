import graphql from './graphql.mjs'
import { log } from 'node:console'
import { inspect } from 'node:util'
import { Programmes } from './programmes.mjs'
import { programmeCoaches } from './programmeCoaches.mjs'
import { programmeSessions } from './sessions.mjs'
import { listAll, listAllIds } from './list.mjs'
import chunk from 'lodash.chunk'

const createSessionCoaches = async (programme) => {
  const coaches = await programmeCoaches(programme)
  if (coaches.length < 1) return

  const sessions = await programmeSessions(programme)
  if (sessions.length < 1) return

  let all = []

  for (const session of sessions) {
    for (const coach of coaches) {
      all.push({ session, coach: coach.id })
    }
  }
  log('createSessionCoaches', all.length)

  const chunks = chunk(all, 100)
  for (const batch of chunks) {
    log('createSessionCoaches batch of ', batch.length)
    all = batch.map(
      (sessionCoach) =>
        `{input: {session: {link: "${sessionCoach.session}"}, coach: {link: "${sessionCoach.coach}"}}}`,
    )

    all = all.join(',')
    const query = `mutation CreateSessionCoaches {
                    sessionCoachCreateMany(input: [${all}]) {
                      sessionCoachCollection {
                        session {
                          id
                        }
                      }
                    }
                  }`
    let list = await graphql(query)
    // log(inspect(list, { colors: true, depth: null }))
  }
}

const listAllSessionCoaches = async () => {
  const list = await listAll('sessionCoachCollection')
  // log(inspect(list, { colors: true, depth: null }))
}

const deleteAllSessionCoaches = async () => {
  let allIds = await listAllIds('sessionCoachCollection')
  if (allIds.length < 1) return

  allIds = allIds.map((id) => `{by: {id: "${id}"}}`)
  const query = `mutation DeleteSessionCoaches  {
                  sessionCoachDeleteMany(input: [${allIds}]) {
                    deletedIds
                  }
                }`
  const list = await graphql(query)
  // log(inspect(list, { colors: true, depth: null }))
}

const createAllSessionCoaches = async () => {
  for (const programme of Programmes) {
    log(`creating session coaches for ${programme}`)
    await createSessionCoaches(programme)
  }
}

await createAllSessionCoaches()
// await createSessionCoaches('roa-junior-squash-programme')
// await createSessionCoaches('roa-club-night')
// await listAllSessionCoaches()
// await deleteAllSessionCoaches()
