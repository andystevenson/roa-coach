import graphql from './graphql.mjs'
import { log } from 'node:console'
import { inspect } from 'node:util'
import { findProgrammeByName } from './programmes.mjs'
import { listAll, listAllIds } from './list.mjs'

import {
  nextTuesday,
  nextSaturday,
  nextFriday,
  ordinalDate,
  today,
} from './dates.mjs'
import dayjs from 'dayjs'

const listAllSessions = async () => {
  return await listAll('sessionCollection')
}

export const allSessionIds = async () => {
  return await listAllIds('sessionCollection')
}

export const deleteAllSessions = async () => {
  const ids = await allSessionIds()
  if (ids.length < 1) return null

  const query = `mutation DeleteSessions {
                  sessionDeleteMany(input: [
                    ${ids.map((id) => `{by: {id: "${id}"}}`).join(',')}
                  ]) {
                    deletedIds
                  }
                }`
  const list = await graphql(query)
  return list
}

const ProgrammeSessions = {
  'roa-elite-junior-camp': [
    {
      date: '2023-07-31',
      start: '2023-07-31T10:00:00.000Z',
      end: '2023-07-31T16:00:00.000Z',
    },
    {
      date: '2023-08-01',
      start: '2023-08-01T10:00:00.000Z',
      end: '2023-08-01T16:00:00.000Z',
    },
    {
      date: '2023-08-02',
      start: '2023-08-02T10:00:00.000Z',
      end: '2023-08-02T16:00:00.000Z',
    },
  ],
  'roa-junior-squash-summer-camps': [
    {
      date: '2023-07-27',
      start: '2023-07-27T10:00:00.000Z',
      end: '2023-07-27T16:00:00.000Z',
    },
    {
      date: '2023-07-28',
      start: '2023-07-28T10:00:00.000Z',
      end: '2023-07-28T16:00:00.000Z',
    },
    {
      date: '2023-08-07',
      start: '2023-08-07T10:00:00.000Z',
      end: '2023-08-07T16:00:00.000Z',
    },
    {
      date: '2023-08-08',
      start: '2023-08-08T10:00:00.000Z',
      end: '2023-08-08T16:00:00.000Z',
    },
    {
      date: '2023-08-29',
      start: '2023-08-29T10:00:00.000Z',
      end: '2023-08-29T16:00:00.000Z',
    },
    {
      date: '2023-08-30',
      start: '2023-08-30T10:00:00.000Z',
      end: '2023-08-30T16:00:00.000Z',
    },
  ],
  'roa-junior-squash-programme': [],
  'roa-individual-coaching': [],
  'roa-skills-and-drills': [],
  'roa-club-night': [],
  'roa-individual-adult-coaching': [],
}

const juniorSquashProgrammeSessions = () => {
  const start = dayjs('2023-06-06')
  const end = dayjs('2023-12-31')
  let nextTue = null
  let nextSat = null

  let day = start
  const dates = []
  while (day.isBefore(end)) {
    nextTue = nextTuesday(day)
    day = nextTue
    nextSat = nextSaturday(day)
    day = nextSat
    if (nextTue.isBefore(end)) dates.push(nextTue)
    if (nextSat.isBefore(end)) dates.push(nextSat)
  }

  const sessionDates = dates.map((session) => {
    const day = session.format('YYYY-MM-DD')
    const date = day
    const start = `${day}T10:00:00.000Z`
    const end = `${day}T16:00:00.000Z`
    return { date, start, end }
  })
  ProgrammeSessions['roa-junior-squash-programme'] = sessionDates
}

const clubNightSessions = () => {
  const start = today
  const end = dayjs('2023-12-31')
  let nextFri = null

  let day = start
  const dates = []
  while (day.isBefore(end)) {
    nextFri = nextFriday(day)
    day = nextFri.add(1, 'day')
    if (nextFri.isBefore(end)) dates.push(nextFri)
  }

  const sessionDates = dates.map((session) => {
    const day = session.format('YYYY-MM-DD')
    const date = day
    const start = `${day}T18:00:00.000Z`
    const end = `${day}T20:00:00.000Z`
    return { date, start, end }
  })
  ProgrammeSessions['roa-club-night'] = sessionDates
}

const skillsAndDrillsSessions = () => {
  const start = today
  const end = dayjs('2023-12-31')
  let nextTue = null

  let day = start
  const dates = []
  while (day.isBefore(end)) {
    nextTue = nextTuesday(day)
    day = nextTue.add(1, 'day')
    if (nextTue.isBefore(end)) dates.push(nextTue)
  }

  const sessionDates = dates.map((session) => {
    const day = session.format('YYYY-MM-DD')
    const date = day
    const start = `${day}T19:00:00.000Z`
    const end = `${day}T20:20:00.000Z`
    return { date, start, end }
  })
  ProgrammeSessions['roa-skills-and-drills'] = sessionDates
}

const addProgrammeSessions = () => {
  juniorSquashProgrammeSessions()
  clubNightSessions()
  skillsAndDrillsSessions()
  for (const programme in ProgrammeSessions) {
    // log(programme, ProgrammeSessions[programme].length)
  }
}

addProgrammeSessions()

export const createSessions = async (programmeId, sessions) => {
  if (sessions.length < 1) return null

  const sessionsInputs = sessions
    .map(
      (session) =>
        `{input: {programme: {link: "${programmeId}"}, date: "${session.date}", start: "${session.start}", end: "${session.end}"}}`,
    )
    .join(',')

  const query = `mutation CreateSessions {
                  sessionCreateMany(
                    input: [${sessionsInputs}]
                  ) {
                    sessionCollection {
                      id
                    }
                  }
                }`
  const list = await graphql(query)
  // console.log(inspect(list, { colors: true, depth: null }))
  return list
}

export const createAllSessions = async () => {
  for (const programme in ProgrammeSessions) {
    const programmeId = await findProgrammeByName(programme)
    if (programmeId) {
      await createSessions(programmeId, ProgrammeSessions[programme])
    }
  }
}

export const programmeSessions = async (programme) => {
  const query = `query FindSessionsByName {
                  programmeSearch(first: 1, filter: {name: {eq: "${programme}"}}) {
                    edges {
                      node {
                        name
                        sessions(first: 100) {
                          edges {
                            node {
                              id
                            }
                          }
                        }
                      }
                    }
                  }
                }`
  let list = await graphql(query)

  list = list?.data?.programmeSearch?.edges[0]?.node?.sessions?.edges?.map(
    (object) => object.node.id,
  )
  log('programmeSessions', list)
  return list
}

// await createAllSessions()
// await allSessionIds()
// await deleteAllSessions()
// await programmeSessions('roa-elite-junior-camp')
// const ids = await allSessionIds()
// console.log(ids)
