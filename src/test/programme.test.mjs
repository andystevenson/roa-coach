import client from '../grafbase/GrafbaseClient.mjs'
import { inspect } from '../grafbase/utilities.mjs'
import * as T from './templates.mjs'
import * as S from './some.mjs'

import { describe, expect, test, afterEach, beforeAll } from 'vitest'

const Type = 'Programme'
const Programme = client.actions[Type]
const Coach = client.actions['Coach']
const ProgrammeCoach = client.actions['ProgrammeCoach']

let Programmes = []
let Sessions = []
let Coaches = []
let Alumni = []
let Players = []

describe(Type, async () => {
  beforeAll(async () => {
    await client.dbclean()
    Coaches = await S.coaches()
    Programmes = await S.programmes()
  })

  afterEach(async () => {
    // await Programme.clean()
  })

  test(`${Type} create`, async () => {
    const programme = T.Programme.programme()
    const created = await Programme.create(programme)
    expect(created)
      .toHaveProperty('name', programme.name)
      .toHaveProperty('category', programme.category)
      .toHaveProperty('invite', programme.invite)
      .toHaveProperty('start', programme.start)
      .toHaveProperty('end', programme.end)
      .toHaveProperty('maxPerSession', programme.maxPerSession)
      .toHaveProperty('open', programme.open)
      .toHaveProperty('launched', programme.launched)
      .toHaveProperty('description', programme.description)
      .toHaveProperty('image', programme.image)
      .toHaveProperty('stripe', programme.stripe)
  })

  test(`${Type} update`, async () => {
    const programme = T.Programme.programme()
    const created = await Programme.create(programme)
    const update = {
      id: created.id,
      description: T.Programme.description(),
    }
    const updated = await Programme.update(update)
    expect(updated)
      .toHaveProperty('id', created.id)
      .toHaveProperty('description', update.description)
  })

  test(`${Type} delete`, async () => {})
  test(`${Type} programme coaches`, async () => {
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
  })
})
