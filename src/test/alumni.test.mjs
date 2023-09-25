import client from '../grafbase/GrafbaseClient.mjs'
import { inspect } from '../grafbase/utilities.mjs'
import { Alumni as AlumniTemplate } from './templates.mjs'

import { describe, expect, test, afterEach, beforeAll } from 'vitest'

const Type = 'Alumni'
const Alumni = client.actions[Type]

describe(Type, async () => {
  beforeAll(async () => {
    await client.dbclean()
  })

  afterEach(async () => {
    await Alumni.clean()
  })

  test(`${Type} create`, async () => {
    const alumni = AlumniTemplate.alumni()
    const created = await Alumni.create(alumni)

    expect(created)
      .toHaveProperty('name', alumni.name)
      .toHaveProperty('email', alumni.email)
      .toHaveProperty('mobile', alumni.mobile)
      .toHaveProperty('psa', alumni.psa)
      .toHaveProperty('bio', alumni.bio)
      .toHaveProperty('image', alumni.image)
      .toHaveProperty('thumbnail', alumni.thumbnail)
      .toHaveProperty('id')
      .toHaveProperty('createdAt')
      .toHaveProperty('updatedAt')
  })

  test(`${Type} update`, async () => {
    const alumni = AlumniTemplate.alumni()

    const created = await Alumni.create(alumni)
    const update = { id: created.id, email: null }
    const updated = await Alumni.update(update)

    expect(updated)
      .toHaveProperty('name', alumni.name)
      .toHaveProperty('email', update.email)
  })

  test(`${Type} delete`, async () => {
    const alumni = AlumniTemplate.alumni()

    const created = await Alumni.create(alumni)
    const update = { id: created.id, bio: AlumniTemplate.bio() }

    const updated = await Alumni.update(update)

    expect(updated)
      .toHaveProperty('name', alumni.name)
      .toHaveProperty('bio', update.bio)

    const deleted = await Alumni.delete(updated)

    expect(deleted).toEqual(updated.id)
  })
})
