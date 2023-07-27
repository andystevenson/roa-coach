import graphql from './graphql.mjs'
import { log } from 'node:console'
import { inspect } from 'node:util'
import {
  nextDayOfWeek,
  nextTuesday,
  nextSaturday,
  nextFriday,
  ordinalDate,
  today,
} from './dates.mjs'
import dayjs from 'dayjs'
import { findCoachByName } from './coaches.mjs'
import { createProgrammeCoaches } from './programmeCoaches.mjs'

export const listProgrammes = async () => {
  const query = `query ListAllProgrammes {
                  programmeCollection(first: 100) {
                    edges {
                      node {
                        id
                        name
                        open
                        start
                        end
                        maxPerSession
                        coaches(first: 100) {
                          edges {
                            node {
                              coach {
                                name
                                email
                                mobile
                              }
                            }
                          }
                        }
                        attendees(first: 100) {
                          edges {
                            node {
                              id
                              programme {
                                name
                              }
                              name
                              email
                              mobile
                              booking
                            }
                          }
                        }
                        sessions(first: 100) {
                          edges {
                            node {
                              date
                              start
                              end
                              hosts(first: 100) {
                                edges {
                                  node {
                                    coach {
                                      name
                                      email
                                      mobile
                                    }
                                  }
                                }
                              }
                              attendees(first: 100) {
                                edges {
                                  node {
                                    attendee {
                                      name
                                      email
                                      mobile
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }`
  const list = await graphql(query)
  log(inspect(list, { colors: true, depth: null }))
  return list
}

export const deleteProgrammes = async () => {
  const query = `mutation DeleteAllProgrammes {
                  programmeDeleteMany(input: [
                    {by: {name: "roa-elite-junior-camp"}},
                    {by: {name: "roa-junior-squash-summer-camps"}},
                    {by: {name: "roa-junior-squash-programme"}},
                    {by: {name: "roa-individual-coaching"}},
                    {by: {name: "roa-individual-adult-coaching"}},
                    {by: {name: "roa-skills-and-drills"}},
                    {by: {name: "roa-club-night"}},
                  ]){
                    deletedIds
                  }
                }`
  const list = await graphql(query)
  log(inspect(list, { colors: true, depth: null }))
  return list
}

export const createProgrammes = async () => {
  const query = `mutation CreateAllProgrammes {
                  programmeCreateMany(input: [
                    {input: {name: "roa-elite-junior-camp", start: "2023-07-31", end: "2023-08-02",maxPerSession: 10, open: false}}
                    {input: {name: "roa-junior-squash-summer-camps", start: "2023-07-27", end: "2023-08-30",maxPerSession: 15, open: true}}
                    {input: {name: "roa-junior-squash-programme", start: "2023-06-06", end: "2023-12-31",maxPerSession: 50, open: true}}
                    {input: {name: "roa-individual-coaching", start: "2023-07-01", end: "2023-12-31",maxPerSession: 50, open: true}}
                    {input: {name: "roa-individual-adult-coaching", start: "2023-07-01", end: "2023-12-31",maxPerSession: 50, open: true}}
                    {input: {name: "roa-club-night", start: "2023-07-01", end: "2023-12-31",maxPerSession: 50, open: true}}
                    {input: {name: "roa-skills-and-drills", start: "2023-07-01", end: "2023-12-31",maxPerSession: 12, open: true}}
                  ]) {
                    programmeCollection {
                      id
                      name
                      start
                      end
                      open
                      maxPerSession
                    }
                  }
                }`
  const list = await graphql(query)
  log(inspect(list, { colors: true, depth: null }))
  return list
}

export const findProgrammeByName = async (name) => {
  const query = `query FindProgramme {
                  programmeSearch(first: 100, filter: {name: {eq: "${name}"}}) {
                    edges {
                      node {
                        id
                        name
                      }
                    }
                  }
                }`
  const list = await graphql(query)
  const id = list.data?.programmeSearch?.edges[0]?.node.id
  log({ id })
  return id
}

const addProgrammeCoaches = async (programme, ...coaches) => {
  const programmeId = await findProgrammeByName(programme)
  if (!programmeId) return null
  let coachIds = await Promise.allSettled(
    coaches.map(async (coach) => {
      return await findCoachByName(coach)
    }),
  )
  log({ programmeId, coachIds }, coachIds.length)
  coachIds = coachIds.filter((coach) => coach.value).map((coach) => coach.value)
  if (coachIds.length === 0) return

  return await createProgrammeCoaches(programme, coachIds)
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
      date: '2023-08-03',
      start: '2023-08-03T10:00:00.000Z',
      end: '2023-08-03T16:00:00.000Z',
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
  log(start.format('YYYY-MM-DD'))
  let nextTue = null
  let nextSat = null

  let day = start
  log('start', ordinalDate(start))
  log('tue', ordinalDate(end))
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
  log(start.format('YYYY-MM-DD'))
  let nextFri = null

  let day = start
  const dates = []
  while (day.isBefore(end)) {
    nextFri = nextFriday(day)
    day = nextFri.add(1, 'day')
    log('nextFri', ordinalDate(day))
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
  log(start.format('YYYY-MM-DD'))
  let nextTue = null

  let day = start
  const dates = []
  while (day.isBefore(end)) {
    nextTue = nextTuesday(day)
    day = nextTue.add(1, 'day')
    log('nextTue', ordinalDate(day))
    if (nextTue.isBefore(end)) dates.push(nextTue)
  }

  const sessionDates = dates.map((session) => {
    const day = session.format('YYYY-MM-DD')
    const date = day
    const start = `${day}T19:00:00.000Z`
    const end = `${day}T20:20:00.000Z`
    return { date, start, end }
  })
  ProgrammeSessions['roa-club-night'] = sessionDates
}

log(inspect(ProgrammeSessions, { colors: true, depth: null }))
for (const programme in ProgrammeSessions) {
  log(programme, ProgrammeSessions[programme].length)
}

const addProgrammeSessions = () => {
  juniorSquashProgrammeSessions()
  clubNightSessions()
  skillsAndDrillsSessions()
}
export const init = () => {}
