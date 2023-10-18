import { client } from '../js/ROAclient.mjs'
import { inspect } from '../grafbase/utilities.mjs'
import * as Template from './templates.mjs'
import * as Some from './some.mjs'
import dayjs from 'dayjs'
import { faker } from '@faker-js/faker'
import sampleSize from 'lodash.samplesize'
import kebabCase from 'lodash.kebabcase'

import { describe, expect, test, beforeEach, beforeAll, vi } from 'vitest'

// I am having to put all tests in this monolithic test suite because there is no simple way
// of running parallel tests on the grafbase db without the individual test files interfering
// with each other.

const Alumni = client.Alumni
const Coach = client.Coach
const Player = client.Player
const Programme = client.Programme
const Session = client.Session
const SessionPlayer = client.SessionPlayer
const Payment = client.Payment

let Programmes = []
let Coaches = []
let Players = []

describe('ROA', async () => {
  beforeAll(async () => {
    await client.dbclean()
    Coaches = await Some.coaches()
    Programmes = await Some.programmes()
    Players = await Some.players()
  })

  beforeEach(async (context) => {
    context.Coaches = Coaches
    context.Programmes = Programmes
  })

  // Alumni tests
  test(`Alumni create`, async () => {
    const alumni = Template.Alumni.alumni()
    const created = await Alumni.create(alumni)

    expect(created)
      .toHaveProperty('name', alumni.name)
      .toHaveProperty('email', alumni.email)
      .toHaveProperty('mobile', alumni.mobile)
      .toHaveProperty(
        'psa',
        `https://www.psaworldtour.com/player/${kebabCase(alumni.name)}/`,
      )
      .toHaveProperty('bio', alumni.bio)
      .toHaveProperty('image', alumni.image)
      .toHaveProperty('thumbnail', alumni.thumbnail)
      .toHaveProperty('id')
      .toHaveProperty('createdAt')
      .toHaveProperty('updatedAt')
  })

  test(`Alumni update`, async () => {
    const alumni = Template.Alumni.alumni()

    const created = await Alumni.create(alumni)
    const update = { id: created.id, email: null }
    const updated = await Alumni.update(update)

    expect(updated)
      .toHaveProperty('name', alumni.name)
      .toHaveProperty('email', update.email)
  })

  test(`Alumni delete`, async () => {
    const alumni = Template.Alumni.alumni()

    const created = await Alumni.create(alumni)
    const update = { id: created.id, bio: Template.Alumni.bio() }

    const updated = await Alumni.update(update)

    expect(updated)
      .toHaveProperty('name', alumni.name)
      .toHaveProperty('bio', update.bio)

    const deleted = await Alumni.delete(updated)

    expect(deleted).toEqual(updated.id)
  })

  // Coach tests
  test(`Coach create`, async () => {
    const coach = Template.Coach.coach()
    const created = await Coach.create(coach)
    expect(created)
      .toHaveProperty('name', coach.name)
      .toHaveProperty('email', coach.email)
      .toHaveProperty('mobile', coach.mobile)
      .toHaveProperty('bio', coach.bio)
      .toHaveProperty('image', coach.image)
      .toHaveProperty('thumbnail', coach.thumbnail)
      .toHaveProperty('id')
      .toHaveProperty('createdAt')
      .toHaveProperty('updatedAt')
    await Coach.delete(created)
  })

  test(`Coach update`, async () => {
    const coach = Template.Coach.coach()

    const created = await Coach.create(coach)
    const update = { id: created.id, bio: Template.Coach.bio() }
    const updated = await Coach.update(update)

    expect(updated)
      .toHaveProperty('name', coach.name)
      .toHaveProperty('bio', update.bio)

    await Coach.delete(created)
  })

  test(`Coach delete`, async () => {
    const coach = Template.Coach.coach()

    const created = await Coach.create(coach)
    const update = { id: created.id, email: null }
    const updated = await Coach.update(update)
    const deleted = await Coach.delete(updated)

    expect(deleted).toEqual({
      id: updated.id,
      programmes: [],
      sessions: [],
    })
  })

  test(`Coach ids`, async () => {
    let ids = await Coach.ids()
    console.log({ ids })
    expect(ids).toHaveLength(Coaches.length)
    ids = await client.invoke({ type: 'Coach', action: 'ids' })
    expect(ids).toHaveLength(Coaches.length)
    ids = await client.invoke({ type: 'Coach', action: 'list' })
    expect(ids).toHaveLength(Coaches.length)
  })
  // Player test
  test('Player create', async () => {
    const player = Template.Player.player()
    const created = await Player.create(player)

    expect(created)
      .toHaveProperty('name', player.name)
      .toHaveProperty('dob', player.dob)
      .toHaveProperty('email', player.email)
      .toHaveProperty('notes')
      .toHaveProperty('notes.0.note', 'n0')
      .toHaveProperty('notes.1.note', 'n1')

    await Player.delete(created)
  })

  test('Player create + delete', async () => {
    const player = Template.Player.player()
    const created = await Player.create(player)

    expect(created)
      .toHaveProperty('name', player.name)
      .toHaveProperty('dob', player.dob)
      .toHaveProperty('email', player.email)

    const deleted = await Player.delete(created)

    expect(deleted).toEqual({
      id: created.id,
      notes: [created.notes[0].id, created.notes[1].id],
      sessions: [],
      payments: [],
    })
  })

  test('Player create + update', async () => {
    const player = Template.Player.player()
    const created = await Player.create(player)

    const email = 'andy@example.com'
    let update = { id: created.id, email }
    update = await Player.update(update)

    expect(update).toHaveProperty('email', email)

    await Player.delete(update)
  })

  test('Player read', async () => {
    const player = Template.Player.player()
    const created = await Player.create(player)

    const read = await Player.read(created)

    expect(read)
      .toHaveProperty('name', created.name)
      .toHaveProperty('dob', created.dob)
      .toHaveProperty('email', created.email)

    await Player.delete(read)
  })

  test('Player create + read + update + read + delete', async () => {
    const player = Template.Player.player()
    const created = await Player.create(player)
    let read = await Player.read(created)

    expect(read.id).toEqual(created.id)

    const email = 'andy@example.com'
    const update = await Player.update({ id: read.id, email })

    expect(update).toHaveProperty('email', email)

    read = await Player.read(created)

    expect(read).toHaveProperty('email', email)

    const deleted = await Player.delete(read)

    expect(deleted)
      .toHaveProperty('notes')
      .toHaveProperty('sessions', [])
      .toHaveProperty('payments', [])
  })

  test('Player update with notes.create&deleted', async () => {
    const player = Template.Player.player()
    const created = await Player.create(player)

    expect(created).toHaveProperty('name', player.name)

    const notes = await Player.notes(created)

    expect(notes)
      .toHaveLength(2)
      .toHaveProperty('0.note', 'n0')
      .toHaveProperty('1.note', 'n1')

    const update = {
      create: [{ note: 'new note 99' }, { note: 'new note 100' }],
      update: [{ ...notes[0], note: `${notes[0].note} updated` }],
      delete: [notes[1]],
    }

    const updated = await Player.notes({ id: created.id, ...update })

    expect(updated)
      .toHaveLength(3)
      .toHaveProperty('2.note', 'n0 updated')
      .toHaveProperty('0.note', 'new note 99')
      .toHaveProperty('1.note', 'new note 100')

    await Player.delete(created)
  })

  // Programme test

  test(`Programme create`, async () => {
    const programme = Template.Programme.programme()
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
    await Programme.delete(created)
  })

  test(`Programme update`, async () => {
    const programme = Template.Programme.programme()
    const created = await Programme.create(programme)
    const update = {
      id: created.id,
      description: Template.Programme.description(),
    }
    const updated = await Programme.update(update)
    expect(updated)
      .toHaveProperty('id', created.id)
      .toHaveProperty('description', update.description)
    await Programme.delete(created)
  })

  test(`Programme delete`, async () => {
    const programme = Template.Programme.programme()
    const created = await Programme.create(programme)

    const coaches = await Programme.coaches(created)
    const deleted = await Programme.delete(created)
    expect(deleted).toEqual({
      id: created.id,
      days: [],
      prices: [],
      coaches: coaches.map((coach) => coach.id),
      sessions: [],
      payments: [],
      notes: [],
    })
  })

  // Programme test (more complicated)

  test(`Programme programme coaches`, async () => {
    // add all the coaches to all the programmes
    const np = Programmes.length
    const nc = Coaches.length

    for (const programme of Programmes) {
      const coaches = await Programme.coaches(programme)
      expect(coaches.length).toEqual(nc)
      for (const coach of Coaches) {
        const programmes = await Coach.programmes(coach)
        expect(programmes.length).toEqual(np)
      }
    }
  })

  test(`Programme programme coaches (not auto populated)`, async () => {
    // 1st. Create a new Programme and check that it's coaches are auto populated.
    const today = dayjs().format('YYYY-MM-DD')
    const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
    let name = 'Julie Camp'
    const julie = await Programme.create({
      name,
      start: today,
      end: tomorrow,
    })

    // these will be the defaults
    const coaches = await Coach.ids()
    const cl = coaches.length

    // 2nd. Create a new Programme and give it a random subset of all coaches
    const size = faker.number.int({ min: 1, max: cl })
    const sampleCoaches = sampleSize(coaches, size)

    const programmeCoaches = sampleCoaches.map((coach) => ({ coach }))

    name = 'WWSC'
    const WWSC = {
      name,
      start: today,
      end: tomorrow,
      coaches: { create: programmeCoaches },
    }

    const wwsc = await Programme.create(WWSC)
    const pcs = await Programme.coaches(wwsc)
    expect(pcs.length).toEqual(size)
    await Programme.delete(julie)
  })

  test(`Programme programme coaches (auto populated)`, async () => {
    const name = 'Andy Camp'

    // 1st. Create a new Programme and check that it's coaches are auto populated.active
    const today = dayjs().format('YYYY-MM-DD')
    const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
    const andy = await Programme.create({
      name,
      start: today,
      end: tomorrow,
    })

    let coaches = await Programme.coaches(andy)

    expect(coaches.length).toBe(Coaches.length)

    await Programme.delete(andy)
  })

  test(`Programme session (defaults)`, async () => {
    const date = '2023-01-01'
    const startTime = '2023-01-01T14:00:00.000Z'
    const endTime = '2023-01-01T15:00:00.000Z'
    const description = 'a smashing squash session'
    const withSession = await Programme.create({
      name: 'Andy Camp',
      start: '2023-01-01',
      end: '2023-02-01',
      sessions: {
        create: [{ date, startTime, endTime, description }],
      },
    })

    expect(withSession.sessions.length).toBe(1)
    expect(withSession.sessions[0])
      .toHaveProperty('date', date)
      .toHaveProperty('startTime', startTime)
      .toHaveProperty('endTime', endTime)
      .toHaveProperty('description', description)
    const programmeCoaches = withSession.coaches.map(({ coach }) => coach.id)
    const sessionCoaches = withSession.sessions[0].coaches.map(
      ({ coach }) => coach.id,
    )
    expect(programmeCoaches).toEqual(sessionCoaches)

    const deleted = await Programme.delete(withSession)
  })

  test(`Programme session (single programme coach)`, async () => {
    const date = '2023-01-01'
    const startTime = '2023-01-01T14:00:00.000Z'
    const endTime = '2023-01-01T15:00:00.000Z'
    const description = 'a smashing squash session'
    const withSession = await Programme.create({
      name: 'Andy Camp',
      start: '2023-01-01',
      end: '2023-02-01',
      coaches: { create: [{ coach: Coaches[0].id }] },
      sessions: {
        create: [{ date, startTime, endTime, description }],
      },
    })

    expect(withSession.sessions.length).toBe(1)
    expect(withSession.sessions[0])
      .toHaveProperty('date', date)
      .toHaveProperty('startTime', startTime)
      .toHaveProperty('endTime', endTime)
      .toHaveProperty('description', description)
    const programmeCoaches = withSession.coaches.map(({ coach }) => coach.id)
    const sessionCoaches = withSession.sessions[0].coaches.map(
      ({ coach }) => coach.id,
    )
    expect(programmeCoaches).toEqual(sessionCoaches)
    expect(programmeCoaches.length).toEqual(sessionCoaches.length).not.toBe(0)

    const deleted = await Programme.delete(withSession)
  })

  test(`Programme session (sample session coaches)`, async () => {
    const date = '2023-01-01'
    const startTime = '2023-01-01T14:00:00.000Z'
    const endTime = '2023-01-01T15:00:00.000Z'
    const description = 'a smashing squash session'

    // these will be the defaults
    const coaches = await Coach.ids()
    const cl = coaches.length

    // 2nd. Create a new Programme and give it a random subset of all coaches
    const size = faker.number.int({ min: 1, max: cl })
    const sampleCoaches = sampleSize(coaches, size)

    let sessionCoaches = sampleCoaches.map((coach) => ({ coach }))

    const withSession = await Programme.create({
      name: 'Andy Camp',
      start: '2023-01-01',
      end: '2023-02-01',
      sessions: {
        create: [
          {
            date,
            startTime,
            endTime,
            description,
            coaches: { create: sessionCoaches },
          },
        ],
      },
    })

    expect(withSession.sessions.length).toBe(1)
    expect(withSession.sessions[0])
      .toHaveProperty('date', date)
      .toHaveProperty('startTime', startTime)
      .toHaveProperty('endTime', endTime)
      .toHaveProperty('description', description)

    expect(withSession.sessions[0].coaches.length).toBe(size)

    const deleted = await Programme.delete(withSession)
  })

  test(`Programme session (sample session notes)`, async () => {
    const date = '2023-01-01'
    const startTime = '2023-01-01T14:00:00.000Z'
    const endTime = '2023-01-01T15:00:00.000Z'
    const description = 'a smashing squash session'

    // these will be the defaults
    const coaches = await Coach.ids()
    const cl = coaches.length

    // 2nd. Create a new Programme and give it a random subset of all coaches
    const size = faker.number.int({ min: 1, max: cl })
    const sampleCoaches = sampleSize(coaches, size)

    let sessionCoaches = sampleCoaches.map((coach) => ({ coach }))

    const withSession = await Programme.create({
      name: 'Andy Camp',
      start: '2023-01-01',
      end: '2023-02-01',
      sessions: {
        create: [
          {
            date,
            startTime,
            endTime,
            description,
            coaches: { create: sessionCoaches },
            notes: {
              create: [
                { note: 'session note 0' },
                { note: 'session note 1' },
                { note: 'session note 2' },
              ],
            },
          },
        ],
      },
    })

    expect(withSession.sessions.length).toBe(1)
    expect(withSession.sessions[0])
      .toHaveProperty('date', date)
      .toHaveProperty('startTime', startTime)
      .toHaveProperty('endTime', endTime)
      .toHaveProperty('description', description)

    expect(withSession.sessions[0].coaches.length).toBe(size)
    expect(withSession.sessions[0].notes.length).toBe(3)

    const deleted = await Programme.delete(withSession)
  })

  test(`Programme session (sample session notes create/update/delete)`, async () => {
    const date = '2023-01-01'
    const startTime = '2023-01-01T14:00:00.000Z'
    const endTime = '2023-01-01T15:00:00.000Z'
    const description = 'a smashing squash session'

    // these will be the defaults
    const coaches = await Coach.ids()
    const cl = coaches.length

    // 2nd. Create a new Programme and give it a random subset of all coaches
    const size = faker.number.int({ min: 1, max: cl })
    const sampleCoaches = sampleSize(coaches, size)

    let sessionCoaches = sampleCoaches.map((coach) => ({ coach }))

    const withSession = await Programme.create({
      name: 'Andy Camp',
      start: '2023-01-01',
      end: '2023-02-01',
      sessions: {
        create: [
          {
            date,
            startTime,
            endTime,
            description,
            coaches: { create: sessionCoaches },
            notes: {
              create: [
                { note: 'session note 0' },
                { note: 'session note 1' },
                { note: 'session note 2' },
              ],
            },
          },
        ],
      },
    })

    expect(withSession.sessions.length).toBe(1)
    expect(withSession.sessions[0])
      .toHaveProperty('date', date)
      .toHaveProperty('startTime', startTime)
      .toHaveProperty('endTime', endTime)
      .toHaveProperty('description', description)

    expect(withSession.sessions[0].coaches.length).toBe(size)
    expect(withSession.sessions[0].notes.length).toBe(3)

    const note0 = withSession.sessions[0].notes[0]
    const note1 = withSession.sessions[0].notes[1]
    const note2 = withSession.sessions[0].notes[2]

    const updated = await Session.update({
      id: withSession.sessions[0].id,
      notes: {
        create: [
          { note: 'newly created note 3' },
          { note: 'newly created note 4' },
        ],
        update: [
          { id: note0.id, note: `${note0.note} updated` },
          { id: note2.id, note: `${note2.note} updated` },
        ],
        delete: [note1],
      },
    })

    const notes = await Session.notes({ id: updated.id })

    expect(notes.length).toBe(4)
    expect(notes)
      .toHaveProperty('0.note', 'session note 0 updated')
      .toHaveProperty('1.note', 'session note 2 updated')
      .toHaveProperty('2.note', 'newly created note 3')
      .toHaveProperty('3.note', 'newly created note 4')

    const deleted = await Programme.delete(withSession)
    expect(deleted.coaches).toHaveLength(Coaches.length)
    expect(deleted.sessions).toHaveLength(1)
    expect(deleted.sessions[0].coaches).toHaveLength(size)
    expect(deleted.sessions[0].notes).toHaveLength(4)
  })

  test(`Programme days`, async () => {
    // create
    const startTime = '2023-01-01T14:00:00.000Z'
    const endTime = '2023-01-01T15:00:00.000Z'
    const withDays = await Programme.create({
      name: 'Andy Camp',
      start: '2023-01-01',
      end: '2023-02-01',
      days: { create: [{ day: 'Tuesday', startTime, endTime }] },
      sessions: [],
    })

    const sessions = await Programme.sessions(withDays)
    expect(sessions.length).toBe(5)
    await Programme.delete(withDays)
  })

  test(`Programme days x 2`, async () => {
    // create
    const startTime = '2023-01-01T14:00:00.000Z'
    const endTime = '2023-01-01T15:00:00.000Z'
    const withDays = await Programme.create({
      name: 'Andy Camp',
      start: '2023-01-01',
      end: '2023-02-01',
      days: {
        create: [
          { day: 'Tuesday', startTime, endTime },
          { day: 'Saturday', startTime, endTime },
        ],
      },
      sessions: [],
    })

    const sessions = await Programme.sessions(withDays)
    expect(sessions.length).toBe(9)
    expect(withDays.sessions).toHaveLength(9)
    await Programme.delete(withDays)
  })

  test(`Programme days x 2, kickoff session`, async () => {
    // create
    const startTime = '2023-01-01T14:00:00.000Z'
    const endTime = '2023-01-01T15:00:00.000Z'
    const withDays = await Programme.create({
      name: 'Andy Camp',
      start: '2023-01-01',
      end: '2023-02-01',
      days: {
        create: [
          { day: 'Tuesday', startTime, endTime },
          { day: 'Saturday', startTime, endTime },
        ],
      },
      sessions: {
        create: [
          {
            date: '23-01-01',
            startTime: '2023-01-01T09:00:00.000Z',
            endTime: '2023-01-01T11:00:00.000Z',
            description: 'a kickoff session',
          },
        ],
      },
    })

    const sessions = await Programme.sessions(withDays)
    expect(sessions.length).toBe(10)
    expect(withDays.sessions).toHaveLength(1)

    await Programme.delete(withDays)
  })

  test(`Programme days x 2, kickoff session, prices`, async () => {
    // create
    const startTime = '2023-01-01T14:00:00.000Z'
    const endTime = '2023-01-01T15:00:00.000Z'
    const withDays = await Programme.create({
      name: 'Andy Camp',
      start: '2023-01-01',
      end: '2023-02-01',
      days: {
        create: [
          { day: 'Tuesday', startTime, endTime },
          { day: 'Saturday', startTime, endTime },
        ],
      },
      prices: {
        create: [
          { unitPrice: 20.0, threshold: 1, member: 'Member' },
          { unitPrice: 15.0, threshold: 10, member: 'Member' },
          { unitPrice: 25.0, threshold: 1, member: 'NonMember' },
          { unitPrice: 30.0, threshold: 10, member: 'NonMember' },
        ],
      },
      sessions: {
        create: [
          {
            date: '23-01-01',
            startTime: '2023-01-01T09:00:00.000Z',
            endTime: '2023-01-01T11:00:00.000Z',
            description: 'a kickoff session',
          },
        ],
      },
    })

    const sessions = await Programme.sessions(withDays)
    expect(sessions.length).toBe(10)
    expect(withDays.sessions).toHaveLength(1)

    await Programme.delete(withDays)
  })

  test(`Programme days x 2, player signup`, async () => {
    // create
    const startTime = '2023-01-01T14:00:00.000Z'
    const endTime = '2023-01-01T15:00:00.000Z'

    // hard limit of 100
    const some = faker.number.int({ min: 1, max: Players.length })
    const somePlayers = sampleSize(Players, some)

    const withDays = await Programme.create({
      name: 'Andy Camp',
      start: '2023-01-01',
      end: '2023-02-01',
      days: {
        create: [
          { day: 'Tuesday', startTime, endTime },
          { day: 'Saturday', startTime, endTime },
        ],
      },
      prices: {
        create: [
          { unitPrice: 20.0, threshold: 1, member: 'Member' },
          { unitPrice: 15.0, threshold: 10, member: 'Member' },
          { unitPrice: 25.0, threshold: 1, member: 'NonMember' },
          { unitPrice: 30.0, threshold: 10, member: 'NonMember' },
        ],
      },
    })

    let sessions = await Programme.sessions(withDays)
    let players = []
    for (const session of sessions) {
      for (const player of somePlayers) {
        players.push({ session: session.id, player: player.id })
      }
    }

    // hard limit of 100 creates in graphql
    let al = players.length
    if (al > 90) {
      await Programme.delete(withDays)
      return
    }

    players = await SessionPlayer.createMany(players)
    const cmal = players.length

    expect(al).toBe(cmal)
    expect(sessions.length).toBe(9)
    expect(withDays.sessions).toHaveLength(9)

    for (const session of sessions) {
      players = await Session.players(session)
      expect(players.length).toBe(some)
    }

    for (const player of somePlayers) {
      const playerSessions = await Player.sessions(player)
      expect(playerSessions.length).toBe(sessions.length)
    }

    await Programme.delete(withDays)
  })

  test(`Programme payments`, async () => {
    const some = faker.number.int({ min: 1, max: Players.length })
    const somePlayers = sampleSize(Players, some)

    const several = faker.number.int({ min: 1, max: Programmes.length })
    const someProgrammes = sampleSize(Programmes, several)

    let payments = []
    for (const player of somePlayers) {
      for (const programme of someProgrammes) {
        const quantity = faker.number.int({ min: 1, max: 12 })
        const unitPrice = faker.number.float({
          min: 20,
          max: 50,
          precision: 0.01,
        })
        payments.push({
          programme: programme.id,
          player: player.id,
          booking: faker.string.uuid(),
          email: player.email,
          date: dayjs().format('YYYY-MM-DD'),
          time: dayjs().toISOString(),
          price: quantity * unitPrice,
          paymentType: faker.helpers.arrayElement(['Online', 'Cash']),
        })
      }
    }

    let pl = payments.length
    payments = await Payment.createMany(payments)
    const cmpl = payments.length
    expect(pl).toBe(cmpl)

    for (const player of somePlayers) {
      const payments = await Player.payments(player)
      expect(payments.length).toBe(someProgrammes.length)
    }

    for (const programme of someProgrammes) {
      const payments = await Programme.payments(programme)
      expect(payments.length).toBe(somePlayers.length)
    }

    inspect({ payments })
  })
})
