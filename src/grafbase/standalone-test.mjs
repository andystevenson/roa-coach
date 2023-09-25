import client from './GrafbaseClient.mjs'
import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import { inspect } from './utilities.mjs'

const Player = {
  create: {
    action: 'create',
    type: 'Player',
    name: 'Andy Stevenson',
    dob: '1964-01-30',
  },

  createWithNotes: {
    action: 'create',
    type: 'Player',
    name: 'Andy Stevenson',
    dob: '1964-01-30',
    notes: { create: [{ note: 'note 0' }, { note: 'note 1' }] },
  },

  update: {
    action: 'update',
    type: 'Player',
    email: 'andystevenson@mac.com',
  },

  updateWithNotes: {
    action: 'update',
    type: 'Player',
    email: 'andy@example.com',
    notes: { update: [] },
  },

  updateAndCreateWithNotes: {
    action: 'update',
    type: 'Player',
    email: 'andy2@example.com',
    notes: {
      create: [{ note: 'note 99' }, { note: 'note 100' }, { note: 'note 101' }],
      update: [],
    },
  },

  updateAndCreateAndDeleteWithNotes: {
    action: 'update',
    type: 'Player',
    email: 'andy2@example.com',
    notes: {
      create: [{ note: 'note 99' }, { note: 'note 100' }, { note: 'note 101' }],
      update: [],
      delete: [],
    },
  },

  read: {
    action: 'read',
    type: 'Player',
  },

  delete: {
    action: 'delete',
    type: 'Player',
  },

  notes: {
    action: 'notes',
    type: 'Player',
    notes: { list: [] },
  },

  notesIds: {
    action: 'notes',
    type: 'Player',
    notes: { ids: [] },
  },

  sessions: {
    action: 'sessions',
    type: 'Player',
    sessions: { list: [] },
  },

  payments: {
    action: 'payments',
    type: 'Player',
    payments: { list: [] },
  },
}

const PlayerNotes = {
  action: 'list',
  type: 'PlayerNote',
}

const SessionAttendees = {
  action: 'list',
  type: 'SessionAttendee',
}

async function run() {
  let result = await client.invoke(Player.createWithNotes)
  console.log('Player.createWithNotes ... %o', result)
  const { id } = result

  result = await client.invoke({ id, ...Player.update })
  console.log('Player.update ... %o', result)

  result = await client.invoke({ id, ...Player.read })
  console.log('Player.read ... %o', result)

  result = await client.invoke({ id, ...Player.notes })
  console.log('Player.notes ... %o', result)

  result = await client.invoke({ id, ...Player.notesIds })
  console.log('Player.notesIds ... %o', result)

  result = await client.invoke({ id, ...Player.sessions })
  console.log('Player.sessions ... %o', result)

  result = await client.invoke({ id, ...Player.payments })
  console.log('Player.payments ... %o', result)

  result = await client.invoke({ id, ...Player.delete })

  result = await client.invoke(PlayerNotes)
  console.log('PlayerNotes', result)

  result = await client.invoke(SessionAttendees)
  console.log('SessionAttendees', result)
}

async function run2() {
  let result = await client.invoke(Player.createWithNotes)

  const { id } = result
  console.log('Player.createWithNotes ... %o', result)

  result = await client.invoke({ id, ...Player.read })
  console.log('Player.read ... %o', result)

  result = await client.invoke({ id, ...Player.notes })
  console.log('Player.notes ... %o', result.list)

  const updatedNotes = result.list.map((n) => {
    let { note } = n
    note += ` updated`
    n.note = note
    return n
  })

  const clone = structuredClone(Player.updateWithNotes)
  clone.notes.update = updatedNotes
  console.log('%o', { clone })

  result = await client.invoke({ id, ...clone })
  console.log('Player.updateWithNotes ... %o', result)

  result = await client.invoke({ id, ...Player.notes })
  console.log('Player.notes after updateWithNotes ... %o', result.list)

  result = await client.invoke({ id, ...Player.delete })

  result = await client.invoke(PlayerNotes)
  console.log('PlayerNotes', result)

  result = await client.invoke(SessionAttendees)
  console.log('SessionAttendees', result)
}

async function run3() {
  let result = await client.invoke(Player.createWithNotes)
  console.log('Player.createWithNotes ... %0', result)

  const { id } = result

  result = await client.invoke({ id, ...Player.read })

  result = await client.invoke({ id, ...Player.notes })
  console.log('Player.notes....', result.list)

  const updatedNotes = result.list.map((n) => {
    let { note } = n
    note += ` updated`
    n.note = note
    return n
  })

  const clone = structuredClone(Player.updateAndCreateWithNotes)
  clone.notes.update = updatedNotes
  console.log('%o', { clone })

  result = await client.invoke({ id, ...clone })
  console.log('Player.updateAndCreateWithNotes ... %o', result)

  result = await client.invoke({ id, ...Player.notes })
  console.log('Player.notes after updateAndCreateWithNotes....', result.list)

  result = await client.invoke({ id, ...Player.delete })

  result = await client.invoke(PlayerNotes)
  console.log('PlayerNotes', result)

  result = await client.invoke(SessionAttendees)
  console.log('SessionAttendees', result)
}

async function run4() {
  let result = await client.invoke(Player.createWithNotes)

  const { id } = result

  result = await client.invoke({ id, ...Player.read })

  result = await client.invoke({ id, ...Player.notes })
  console.log('Player.notes....', result.list)

  const updatedNotes = result.list.map((n) => {
    let { note } = n
    note += ` updated`
    n.note = note
    return n
  })

  const clone = structuredClone(Player.updateAndCreateAndDeleteWithNotes)
  clone.notes.update = updatedNotes.slice(0, -1)
  clone.notes.delete = updatedNotes.slice(-1).map((n) => n.id)
  // console.log('%o', { clone })

  result = await client.invoke({ id, ...clone })
  console.log('Player.updateAndCreateAndDeleteWithNotes ... %o', result)

  result = await client.invoke({ id, ...Player.notes })
  console.log(
    'Player.notes after updateAndCreateAndDeleteWithNotes....',
    result.list,
  )

  result = await client.invoke({ id, ...Player.delete })
  console.log('Player.delete ... %o', result)

  result = await client.invoke(PlayerNotes)
  console.log('PlayerNotes', result)

  result = await client.invoke(SessionAttendees)
  console.log('SessionAttendees', result)
}

const Programme = {
  create: {
    action: 'create',
    type: 'Programme',
    name: faker.company.name(),
    start: dayjs(faker.date.soon({ days: 1 })).format('YYYY-MM-DD'),
    end: dayjs(
      faker.date.future({ days: faker.number.int({ min: 7, max: 365 / 2 }) }),
    ).format('YYYY-MM-DD'),

    days: {
      create: [
        {
          day: faker.date.weekday(),
          startTime: dayjs().hour(10).minute(0).toISOString(),
          endTime: dayjs().hour(11).minute(40).toISOString(),
        },
        {
          day: faker.date.weekday(),
          startTime: dayjs().hour(18).minute(0).toISOString(),
          endTime: dayjs().hour(19).minute(40).toISOString(),
        },
      ],
    },

    prices: {
      create: [
        {
          unitPrice: faker.number.float({
            min: 20.0,
            max: 25.0,
            precision: 0.01,
          }),
          threshold: faker.number.int(1),
          member: 'Member',
        },
        {
          unitPrice: faker.number.float({
            min: 25.0,
            max: 40.0,
            precision: 0.01,
          }),
          threshold: faker.number.int({ min: 2, max: 10 }),
          member: 'NonMember',
        },
      ],
    },

    coaches: {
      create: [],
    },

    sessions: {
      create: [
        {
          date: dayjs(faker.date.soon({ days: 1 })).format('YYYY-MM-DD'),
          startTime: dayjs().hour(10).minute(0).toISOString(),
          endTime: dayjs().hour(11).minute(40).toISOString(),
          description: 'session 0 will be great',
          notes: { create: [{ note: 's0 n0' }, { note: 's0 n1' }] },
        },
        {
          date: dayjs(faker.date.soon({ days: 1 })).format('YYYY-MM-DD'),
          startTime: dayjs().hour(11).minute(0).toISOString(),
          endTime: dayjs().hour(12).minute(40).toISOString(),
          description: 'session 1 will be great',
          notes: { create: [{ note: 's1 n0' }, { note: 's1 n1' }] },
        },
      ],
    },

    payments: {
      create: [],
    },

    notes: {
      create: [{ note: 'p0 n0' }, { note: 'p0 n1' }],
    },
  },

  read: {
    id: null,
    action: 'read',
    type: 'Programme',
  },

  delete: {
    id: null,
    action: 'delete',
    type: 'Programme',
  },

  days: {
    id: null,
    action: 'days',
    type: 'Programme',
    days: { list: [] },
  },

  prices: {
    id: null,
    action: 'prices',
    type: 'Programme',
    prices: { list: [] },
  },

  sessions: {
    id: null,
    action: 'sessions',
    type: 'Programme',
    sessions: { notes: { list: [] } },
  },

  notes: {
    id: null,
    action: 'notes',
    type: 'Programme',
    notes: { list: [] },
  },
}

const ProgrammeDays = {
  action: 'list',
  type: 'ProgrammeDay',
}

const Prices = {
  action: 'list',
  type: 'Price',
}

const Sessions = {
  action: 'list',
  type: 'Session',
}

const SessionNotes = {
  action: 'list',
  type: 'SessionNote',
}

const ProgrammeNotes = {
  action: 'list',
  type: 'ProgrammeNote',
}

async function run5() {
  console.log('%o', Programme.create)
  let result = null
  result = await client.invoke(Programme.create)
  console.log('Programme.create ... %o', result)
  const { id } = result

  result = await client.invoke({ ...Programme.read, id })
  console.log('Programme.read...', result)

  result = await client.invoke({ ...Programme.days, id })
  console.log('Programme.days...', result)

  result = await client.invoke({ ...Programme.prices, id })
  console.log('Programme.prices...', result)

  result = await client.invoke({ ...Programme.sessions, id })
  inspect({ 'Programme.sessions ... %o': result })

  result = await client.invoke({ ...Programme.notes, id })
  console.log('Programme.notes... %o', result)

  result = await client.invoke({ ...Programme.delete, id })
  console.log('Programme.delete ... %o', result)

  result = await client.invoke(ProgrammeDays)
  console.log('ProgrammeDays %o', result)

  result = await client.invoke(Prices)
  console.log('Prices %o', result)

  result = await client.invoke(Sessions)
  console.log('Sessions %o', result)

  result = await client.invoke(SessionNotes)
  console.log('SessionNotes %o', result)

  result = await client.invoke(ProgrammeNotes)
  console.log('ProgrammeNotes %o', result)
}

async function PlayerActions() {
  const type = 'Player'
  const Player = client.actions[type]

  const name = 'Andy Stevenson'
  let exists = await Player.exists({ name })
  inspect({ [name]: exists })

  if (exists) {
    const { id } = exists
    const deleted = await Player.delete({ id })
    inspect({ [name]: deleted })
  }

  let andy = await Player.create({ name, dob: '1964-01-30' })
  inspect({ [name]: andy })

  let listAndy = await Player.list(andy)
  inspect({ 'Player.list.object': listAndy })

  listAndy = await Player.list({ ...andy, select: ['id', 'name', 'member'] })
  inspect({ 'Player.list.object.select': listAndy })

  const names = await Player.list('name id')
  inspect({ 'Player.list.name': names })

  const nameAndDob = await Player.list(['id', 'name', 'dob', 'notes'])
  inspect({ 'Player.list.nameAndDob': nameAndDob })

  const nameAndDob1 = await Player.list(['id name dob', 'notes'])
  inspect({ 'Player.list.nameAndDob2': nameAndDob1 })

  const nameAndDob2 = await Player.list([
    'id',
    'name',
    'dob',
    { notes: [{ player: ['id', 'name'] }, 'note'] },
  ])
  inspect({ 'Player.list.nameAndDob2': nameAndDob2 })

  // const { id } = created
  // const deleted = await Player.delete({ id })
  // inspect({ [name]: deleted })
}

async function PlayerIds() {
  const type = 'Player'
  const Player = client.actions[type]

  const name = 'Andy Stevenson'
  let exists = await Player.exists({ name })
  inspect({ [name]: exists })

  if (exists) {
    const { id } = exists
    const deleted = await Player.delete({ id })
    inspect({ [name]: deleted })
  }

  let andy = await Player.create({
    name,
    dob: '1964-01-30',
    notes: { create: [{ note: 'n0' }, { note: 'n1' }] },
  })
  inspect({ [name]: andy })

  const nameDan = 'Daniel Stevenson'
  exists = await Player.exists({ name: nameDan })
  inspect({ [nameDan]: exists })

  if (exists) {
    const { id } = exists
    const deleted = await Player.delete({ id })
    inspect({ [nameDan]: deleted })
  }

  let dan = await Player.create({
    name: nameDan,
    dob: '1991-08-21',
    notes: { create: [{ note: 'dn0' }, { note: 'dn1' }] },
  })
  inspect({ [nameDan]: dan })

  let ids = await Player.ids()
  inspect({ ['All Player Ids']: ids })

  ids = await Player.ids('notes')
  inspect({ ['All Player.notes ids']: ids })

  ids = await Player.ids(dan)
  inspect({ ['Dan ids']: ids })

  ids = await Player.ids({ id: dan.id, select: [{ notes: ['id'] }] })
  inspect({ ['Dan ids.notes']: ids })

  let notes = await Player.notes({ id: dan.id, notes: { list: [] } })
  inspect({ ['Dan notes']: notes })

  ids = await Player.notes({ id: dan.id, notes: { ids: [] } })
  inspect({ ['Dan notes ids']: ids })

  // await client.dbclean()
}
await PlayerIds()
