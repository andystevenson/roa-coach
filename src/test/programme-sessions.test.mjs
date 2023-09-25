import client from '../grafbase/GrafbaseClient.mjs'
import { inspect } from '../grafbase/utilities.mjs'
import * as T from './templates.mjs'
import * as S from './some.mjs'

import {
  describe,
  expect,
  test,
  afterEach,
  beforeEach,
  beforeAll,
} from 'vitest'

const Type = 'Programme'
const Programme = client.actions[Type]
const Coach = client.actions['Coach']
const Player = client.actions['Player']
const ProgrammeCoach = client.actions['ProgrammeCoach']

const programmeCoaches = async ({ Programmes, Coaches }) => {
  const programmeCoaches = []
  // add all the coaches to all the programmes
  const np = Programmes.length
  const nc = Coaches.length

  for (const programme of Programmes) {
    for (const coache of Coaches) {
      const pc = T.ProgrammeCoach.programmeCoach(programme.id, coache.id)
      programmeCoaches.push(pc)
    }
  }

  const created = await ProgrammeCoach.createMany(programmeCoaches)

  const npc = programmeCoaches.length
  const ncr = created.length
  expect(npc).toEqual(ncr)
  // inspect({ npc, ncr, created })

  // read coaches in the programmes
  for (const programme of Programmes) {
    const coaches = await Programme.coaches(programme)
    const name = programme.name
    expect(coaches.length).toEqual(nc)
  }

  // read programmes in coaches
  for (const coach of Coaches) {
    const programmes = await Coach.programmes(coach)
    const name = coach.name
    expect(programmes.length).toEqual(np)
  }

  return created
}

describe(Type, async () => {
  beforeAll(async () => {
    await client.dbclean()
  })

  beforeEach(async (context) => {
    context.Coaches = await S.coaches()
    context.Programmes = await S.programmes()
    context.Players = await S.players()

    const nCoaches = context.Coaches.length
    const nProgrammes = context.Programmes.length
    const nPlayers = context.Players.length
    inspect({ nCoaches, nProgrammes, nPlayers })
  })

  afterEach(async () => {
    await Programme.clean()
    await Coach.clean()
    await Player.clean()
    const isEmpty = await client.dbIsEmpty()
    expect(isEmpty).toEqual(true)
  })

  test(`${Type} programme coaches`, async ({ Programmes, Coaches }) => {
    const pcs = await programmeCoaches({ Programmes, Coaches })
  })

  test(`${Type} programme sessions`, async ({ Programmes, Coaches }) => {
    const pcs = await programmeCoaches({ Programmes, Coaches })
    for (const programme of Programmes) {
      const id = programme.id
      const sessions = await S.sessions({ id })
      const programmeSessions = await Programme.sessions({ id })
      expect(sessions.length).toEqual(programmeSessions.length)
    }
  })
})
