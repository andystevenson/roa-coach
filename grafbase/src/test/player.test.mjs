import client from '../GrafbaseClient.mjs'
import { clean } from '../grafbase-dev.mjs'

import { describe, expect, test, afterEach, beforeAll } from 'vitest'

const create = {
  action: 'create',
  type: 'Player',
  name: 'Andy Stevenson',
  dob: '1964-01-30',
}

const createWithNotes = {
  action: 'create',
  type: 'Player',
  name: 'Andy Stevenson',
  dob: '1964-01-30',
  'PlayerNote-0-note': 'note 0',
  'PlayerNote-1-note': 'note 1',
}

const update = {
  action: 'update',
  type: 'Player',
  email: 'andystevenson@mac.com',
}

const read = {
  action: 'read',
  type: 'Player',
}

const deleteOne = {
  action: 'delete',
  type: 'Player',
}

const notes = {
  action: 'notes',
  subaction: 'list',
  type: 'Player',
}

const notesIds = {
  action: 'notes',
  subaction: 'ids',
  type: 'Player',
}

describe('Player', async () => {
  beforeAll(async () => {
    // console.log('beforeAll')
    await clean()
  })

  afterEach(async () => {
    // console.log('afterEach')
    await clean()
  })

  test('Player create', async () => {
    let result = await client.invoke(create)

    expect(result)
      .toHaveProperty('name', 'Andy Stevenson')
      .toHaveProperty('dob', '1964-01-30')
  })

  test('Player create + update', async () => {
    let result = await client.invoke(create)

    let { id, email } = result

    expect(email).toBeNull()

    result = await client.invoke({ id, ...update })
    email = result.email

    expect(email).toBe('andystevenson@mac.com')
  })

  test('Player read', async () => {
    let result = await client.invoke(create)
    let { id, name } = result

    result = await client.invoke({ id, ...read })
    let readName = result.name

    expect(readName).toBe(name)
  })

  test('Player create, read, update, read, delete', async () => {
    let result = await client.invoke(create)
    let { id, name } = result

    result = await client.invoke({ id, ...read })
    expect(result.name).toBe(name)

    result = await client.invoke({ id, ...update })
    expect(result.email).toBe('andystevenson@mac.com')
    expect(name).toBe('Andy Stevenson')

    result = await client.invoke({ id, ...read })
    expect(result.name).toBe(name)

    result = await client.invoke({ id, ...deleteOne })
    expect(result).toBe(id)
  })

  test('Player create, delete, read', async () => {
    let result = await client.invoke(create)
    let { id, name } = result

    result = await client.invoke({ id, ...deleteOne })
    expect(result).toBe(id)

    result = await client.invoke({ id, ...read })
    expect(result).toBe(null)
  })
})

describe('Player notes', async () => {
  beforeAll(async () => {
    await clean()
  })

  afterEach(async () => {
    await clean()
  })

  test('Player create', async () => {
    let result = await client.invoke(createWithNotes)
    expect(result)
      .toHaveProperty('name', 'Andy Stevenson')
      .toHaveProperty('email', null)

    const { id } = result

    result = await client.invoke({ id, ...update })
    expect(result).toHaveProperty('email', 'andystevenson@mac.com')

    result = await client.invoke({ id, ...read })
    expect(result)
      .toHaveProperty('email', 'andystevenson@mac.com')
      .toHaveProperty('name', 'Andy Stevenson')

    result = await client.invoke({ id, ...notes })
    expect(result)
      .toHaveProperty('0.note', 'note 0')
      .toHaveProperty('1.note', 'note 1')

    result = await client.invoke({ id, ...notesIds })
    expect(result).toHaveLength(2)

    result = await client.invoke({ id, ...deleteOne })
    expect(result).toEqual(id)
  })

  test('Player updateMany', async () => {
    let result = await client.invoke(createWithNotes)
    expect(result)
      .toHaveProperty('name', 'Andy Stevenson')
      .toHaveProperty('email', null)

    const { id } = result

    result = await client.invoke({ id, ...update })
    expect(result).toHaveProperty('email', 'andystevenson@mac.com')

    result = await client.invoke({ id, ...read })
    expect(result)
      .toHaveProperty('email', 'andystevenson@mac.com')
      .toHaveProperty('name', 'Andy Stevenson')

    result = await client.invoke({ id, ...notes })
    expect(result)
      .toHaveProperty('0.note', 'note 0')
      .toHaveProperty('1.note', 'note 1')

    const updateRequest = { ...notes, subaction: 'update' }
    const listOfNotes = result
    listOfNotes.forEach((item) => {
      const { id, note } = item
      const inputId = `update-${id}-note`
      updateRequest[inputId] = `${note} updated`
    })

    result = await client.invoke({ id, ...updateRequest })
    const { updateMany } = result

    expect(updateMany)
      .toHaveProperty('0.note', 'note 0 updated')
      .toHaveProperty('1.note', 'note 1 updated')

    result = await client.invoke({ id, ...notesIds })
    expect(result).toHaveLength(2)

    // result = await client.invoke({ id, ...deleteOne })
    // expect(result).toEqual(id)
  })

  test('Player createMany, updateMany, deleteMany', async () => {
    let result = await client.invoke(createWithNotes)
    expect(result)
      .toHaveProperty('name', 'Andy Stevenson')
      .toHaveProperty('email', null)

    const { id } = result

    result = await client.invoke({ id, ...update })
    expect(result).toHaveProperty('email', 'andystevenson@mac.com')

    result = await client.invoke({ id, ...read })
    expect(result)
      .toHaveProperty('email', 'andystevenson@mac.com')
      .toHaveProperty('name', 'Andy Stevenson')

    result = await client.invoke({ id, ...notes })
    expect(result)
      .toHaveProperty('0.note', 'note 0')
      .toHaveProperty('1.note', 'note 1')

    const newNotes = {
      'PlayerNote-0-note': 'new note 0',
      'PlayerNote-1-note': 'new note 1',
    }

    const updateRequest = { ...notes, subaction: 'update', ...newNotes }
    const listOfNotes = result
    {
      const { id, note } = listOfNotes[0]
      const inputId = `update-${id}-note`
      updateRequest[inputId] = `${note} updated`
    }

    let deleteId = null
    {
      const { id } = listOfNotes[1]
      deleteId = id
      const inputId = `delete-${id}-note`
      updateRequest[inputId] = `delete`
    }

    result = await client.invoke({ id, ...updateRequest })
    const { createMany, updateMany, deleteMany } = result

    expect(createMany)
      .toHaveProperty('0.note', 'new note 0')
      .toHaveProperty('1.note', 'new note 1')

    expect(updateMany).toHaveProperty('0.note', 'note 0 updated')

    expect(deleteMany).toContain(deleteId)

    result = await client.invoke({ id, ...notesIds })
    expect(result).toHaveLength(3)

    result = await client.invoke({ id, ...deleteOne })
    expect(result).toEqual(id)
  })
})
