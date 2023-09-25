import client from '../grafbase/GrafbaseClient.mjs'
import dayjs from 'dayjs'
import { faker } from '@faker-js/faker'
import { inspect } from '../grafbase/utilities.mjs'
import { Player as PlayerTemplate } from './templates.mjs'

import { describe, expect, test, afterEach, beforeAll } from 'vitest'

const Type = 'Player'
const Player = client.actions[Type]
const PlayerNote = client.actions['PlayerNote']

describe(Type, async () => {
  beforeAll(async () => {
    await client.dbclean()
  })

  afterEach(async () => {
    await Player.clean()
  })

  test('Player create', async () => {
    const player = PlayerTemplate.player()
    const created = await Player.create(player)

    expect(created)
      .toHaveProperty('name', player.name)
      .toHaveProperty('dob', player.dob)
      .toHaveProperty('email', player.email)
      .toHaveProperty('notes')
      .toHaveProperty('notes.0.note', 'n0')
      .toHaveProperty('notes.1.note', 'n1')
  })

  test('Player create + delete', async () => {
    const player = PlayerTemplate.player()
    const created = await Player.create(player)

    expect(created)
      .toHaveProperty('name', player.name)
      .toHaveProperty('dob', player.dob)
      .toHaveProperty('email', player.email)

    const deleted = await Player.delete(created)

    expect(deleted).toEqual({
      deleted: created.id,
      notes: [created.notes[0].id, created.notes[1].id],
      sessions: [],
      payments: [],
    })
  })

  test('Player create + update', async () => {
    const player = PlayerTemplate.player()
    const created = await Player.create(player)

    const email = 'andy@example.com'
    let update = { id: created.id, email }
    update = await Player.update(update)

    expect(update).toHaveProperty('email', email)
  })

  test('Player read', async () => {
    const player = PlayerTemplate.player()
    const created = await Player.create(player)

    const read = await Player.read(created)

    expect(read)
      .toHaveProperty('name', created.name)
      .toHaveProperty('dob', created.dob)
      .toHaveProperty('email', created.email)
  })

  test('Player create + read + update + read + delete', async () => {
    const player = PlayerTemplate.player()
    const created = await Player.create(player)
    let read = await Player.read(created)

    expect(read.id).toEqual(created.id)

    const email = 'andy@example.com'
    const update = await Player.update({ id: read.id, email })

    expect(update).toHaveProperty('email', email)

    read = await Player.read(created)

    expect(read).toEqual(update)

    const deleted = await Player.delete(read)

    expect(deleted)
      .toHaveProperty('notes')
      .toHaveProperty('sessions', [])
      .toHaveProperty('payments', [])

    const ids = await PlayerNote.ids()

    expect(ids).toHaveLength(0)
  })

  test('Player update with notes.create&deleted', async () => {
    const player = PlayerTemplate.player()
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
      .toHaveProperty('create')
      .toHaveProperty('update')
      .toHaveProperty('delete')
      .toHaveProperty('id')

    expect(updated.create)
      .toHaveLength(2)
      .toHaveProperty('0.id')
      .toHaveProperty('1.id')
      .toHaveProperty('0.note', 'new note 99')
      .toHaveProperty('1.note', 'new note 100')

    expect(updated.update)
      .toHaveLength(1)
      .toHaveProperty('0.id')
      .toHaveProperty('0.note', 'n0 updated')

    expect(updated.delete).toHaveLength(1).toEqual([notes[1].id])
  })
})
