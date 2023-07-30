import graphql from './graphql.mjs'
import { log } from 'node:console'
import {
  dataFromSearchFieldCollection,
  nodesToData,
  inspect,
} from './utilities.mjs'

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

export const listProgrammesNames = async () => {
  const query = `query ListAllProgrammes {
                  programmeCollection(first: 100) {
                    edges {
                      node {
                        id
                        name
                      }
                    }
                  }
                }`
  let list = await graphql(query)
  list = list.data.programmeCollection.edges.map((object) => object.node)
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
  // log(inspect(list, { colors: true, depth: null }))
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
                  programmeSearch(first: 1, filter: {name: {eq: "${name}"}}) {
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

export const getAttendeesFromNodes = (queryResult) => {
  let result = dataFromSearchFieldCollection(
    queryResult,
    'programme',
    'attendees',
    (attendee) => {
      attendee.payment = attendee.payment.payment
      return attendee
    },
  )
  // inspect(result)
  return result
}

export const getCoachesFromNodes = (queryResult) => {
  let result = dataFromSearchFieldCollection(
    queryResult,
    'programme',
    'coaches',
    (object) => object.coach,
  )
  // inspect(result)
  return result
}

export const getSessionsFromNodes = (queryResult) => {
  let result = dataFromSearchFieldCollection(
    queryResult,
    'programme',
    'sessions',
    (object) => {
      object.attendees = nodesToData(object.attendees.edges).map((attendee) => {
        attendee.attendee.id = attendee.id
        attendee.attendee.payment = attendee.attendee.payment.payment
        return attendee.attendee
      })
      object.hosts = nodesToData(object.hosts.edges).map((host) => {
        host.coach.id = host.id
        return host.coach
      })
      return object
    },
  )
  // inspect(result)
  return result
}

export const listAttendees = async (programme) => {
  const query = `query ListProgrammeAttendees {
                  programmeSearch(first: 1, filter: {name: {eq: "${programme}"}}) {
                    edges  {
                      node {
                        attendees(first: 100) {
                          edges {
                            node {
                              id
                              name
                              email
                              mobile
                              member
                              payment {
                                payment {
                                  id
                                  booking
                                  time
                                  price
                                  quantity
                                  unitPrice
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
  // inspect(list)
  return getAttendeesFromNodes(list)
}

export const listCoaches = async (programme) => {
  const query = `query ListProgrammeCoaches {
                  programmeSearch(first: 1, filter: {name: {eq: "${programme}"}}) {
                    edges {
                      node {
                        coaches(first: 100) {
                          edges {
                            node {
                              coach {
                                id
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
                }`
  const list = await graphql(query)
  // inspect(list)
  return getCoachesFromNodes(list)
}

export const listSessions = async (programme) => {
  const query = `query ListProgrammeSessions {
                  programmeSearch(first: 1, filter: {name: {eq: "${programme}"}}) {
                    edges {
                      node {
                        sessions(first: 100) {
                          edges {
                            node {
                              id
                              date
                              start
                              end
                              attendees(first: 100) {
                                edges {
                                  node {
                                    id
                                    attendee {
                                      id
                                      name
                                      email
                                      mobile
                                      member
                                      payment {
                                        payment {
                                          booking
                                          time
                                          price
                                          unitPrice
                                          quantity
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                              hosts(first: 100) {
                                edges {
                                  node {
                                    id
                                    coach {
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
  // inspect(list)
  return getSessionsFromNodes(list)
}
export const Programmes = [
  'roa-elite-junior-camp',
  'roa-junior-squash-summer-camps',
  'roa-junior-squash-programme',
  'roa-individual-coaching',
  'roa-skills-and-drills',
  'roa-club-night',
  'roa-individual-adult-coaching',
]

export const init = () => {}

// await listProgrammesNames()
// await listCoaches('roa-junior-squash-programme')
// await listSessions('roa-skills-and-drills')
