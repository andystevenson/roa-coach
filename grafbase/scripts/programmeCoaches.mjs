import graphql from './graphql.mjs'
import { log } from 'node:console'
import { inspect } from 'node:util'
import { findProgrammeByName } from './programmes.mjs'
import { findCoachByName } from './coaches.mjs'

export const createProgrammeCoaches = async (programmeId, coachIds) => {
  const query = `mutation CreateProgrammeCoaches {
                  programmeCoachCreateMany(input: [
                    ${coachIds
                      .map(
                        (coach) =>
                          `{input: {programme: {link: "${programmeId}"},  coach: {link: "${coach}"}}}`,
                      )
                      .join(',')}

                  ]) {
                    programmeCoachCollection {
                      id
                      programme {
                        id
                        name
                      }
                      coach {
                        id
                        name
                      }
                    }
                  }
                }`

  const programmeCoaches = await graphql(query)
  // log(inspect(programmeCoaches, { colors: true, depth: null }))
  return programmeCoaches
}

export const listAllProgrammeCoaches = async () => {
  const query = `query ListProgrammeCoaches {
                  programmeCoachCollection(first: 100) {
                    edges {
                      node {
                        id
                      }
                    }
                  }
                }`
  const list = await graphql(query)
  return list
}

export const allProgrammeCoachIds = async () => {
  const list = await listAllProgrammeCoaches()
  const ids = list?.data?.programmeCoachCollection.edges.map(
    (object) => object.node.id,
  )
  return ids
}

export const deleteAllProgrammeCoaches = async () => {
  const ids = await allProgrammeCoachIds()
  if (ids.length < 1) return null

  const query = `mutation DeleteProgrammeCoaches {
                  programmeCoachDeleteMany(input: [
                    ${ids.map((id) => `{by: {id: "${id}"}}`).join(',')}
                  ]) {
                    deletedIds
                  }
                }`
  const list = await graphql(query)
  // log(inspect(list, { colors: true, depth: null }))
  return list
}

export const ProgrammeCoaches = {
  'roa-elite-junior-camp': ['Sam Osborne-Wylde', 'Jonah Bryant'],
  'roa-junior-squash-summer-camps': ['Sam Osborne-Wylde', 'Jonah Bryant'],
  'roa-junior-squash-programme': [
    'Sam Osborne-Wylde',
    'Jonah Bryant',
    'James Averill',
    'Rosie Kirsch',
  ],
  'roa-individual-coaching': ['Sam Osborne-Wylde', 'Jonah Bryant'],
  'roa-skills-and-drills': ['Sam Osborne-Wylde', 'Jonah Bryant'],
  'roa-club-night': ['Sam Osborne-Wylde', 'Jonah Bryant'],
  'roa-individual-adult-coaching': ['Sam Osborne-Wylde', 'Jonah Bryant'],
}

export const addProgrammeCoaches = async (programme, coaches) => {
  const programmeId = await findProgrammeByName(programme)
  if (!programmeId) return null
  let coachIds = await Promise.allSettled(
    coaches.map(async (coach) => {
      return await findCoachByName(coach)
    }),
  )
  coachIds = coachIds.filter((coach) => coach.value).map((coach) => coach.value)
  if (coachIds.length === 0) return
  log({ programmeId, coachIds }, coachIds.length)

  return await createProgrammeCoaches(programmeId, coachIds)
}

export const addAllProgrammeCoaches = async () => {
  for (const programme in ProgrammeCoaches) {
    log({ programme }, ProgrammeCoaches[programme])
    await addProgrammeCoaches(programme, ProgrammeCoaches[programme])
  }
}

export const programmeCoaches = async (programme) => {
  const query = `query FindProgrammeCoachesByName {
                  programmeSearch(first: 1, filter: {name: {eq: "${programme}"}}) {
                    edges {
                      node {
                        name
                        coaches(first: 100) {
                          edges {
                            node {
                              coach {
                                name
                                id
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }`
  let list = await graphql(query)

  list = list?.data?.programmeSearch?.edges[0]?.node?.coaches?.edges?.map(
    (object) => object.node.coach,
  )
  return list
}

await programmeCoaches('roa-junior-squash-programme')
// await addAllProgrammeCoaches()
// await deleteAllProgrammeCoaches()
