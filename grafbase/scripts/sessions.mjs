import graphql from './graphql.mjs'
import { log } from 'node:console'
import { inspect } from 'node:util'
import { findProgrammeByName } from './programmes.mjs'
import { findCoachByName } from './coaches.mjs'

const createAllSessions = async (programmeId, sessions) => {}
const sessionIds = (programme) => {}
const createSessions = async (programme, sessions, coaches) => {
  const programmeId = await findCoachByName(programme)
  if (!programmeId) return
}
const deleteSessions = async (programme) => {}
