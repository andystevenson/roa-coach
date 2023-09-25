import client from '../grafbase/GrafbaseClient.mjs'
import { inspect } from '../grafbase/utilities.mjs'
import { Coach as CoachTemplate } from './templates.mjs'

import { describe, expect, test, afterEach, beforeAll } from 'vitest'

const Type = 'Coach'
const Coach = client.actions[Type]

describe(Type, async () => {
  beforeAll(async () => {
    await client.dbclean()
  })

  afterEach(async () => {
    await Coach.clean()
  })

  test(`${Type} create`, async () => {
    const coach = CoachTemplate.coach()
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
  })

  test(`${Type} update`, async () => {
    const coach = CoachTemplate.coach()

    const created = await Coach.create(coach)
    const update = { id: created.id, bio: CoachTemplate.bio() }
    const updated = await Coach.update(update)

    expect(updated)
      .toHaveProperty('name', coach.name)
      .toHaveProperty('bio', update.bio)
  })

  test(`${Type} delete`, async () => {
    const coach = CoachTemplate.coach()

    const created = await Coach.create(coach)
    const update = { id: created.id, email: null }
    const updated = await Coach.update(update)
    const deleted = await Coach.delete(updated)

    expect(deleted).toEqual({
      deleted: updated.id,
      programmes: [],
      sessions: [],
    })
  })
})
