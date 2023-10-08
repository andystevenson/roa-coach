import dayjs from 'dayjs'
import { faker } from '@faker-js/faker'

import { inspect } from '../grafbase/utilities.mjs'

const Template = {
  type: null,

  name() {
    return faker.person.fullName()
  },

  dob() {
    return dayjs(
      faker.date.between({
        from: '1950-01-01T00:00:00.000Z',
        to: dayjs().toISOString(),
      }),
    ).format('YYYY-MM-DD')
  },

  email() {
    return faker.internet.email()
  },

  mobile() {
    return faker.helpers.fromRegExp('[0-9]{9,11}')
  },

  member() {
    return faker.helpers.arrayElement(['Member', 'NonMember'])
  },

  card() {
    return faker.helpers.fromRegExp('[0-9]{0,6}')
  },

  image() {
    return faker.image.urlPicsumPhotos({ width: 300, height: 600 })
  },

  thumbnail() {
    return faker.image.avatar()
  },

  role() {
    return faker.helpers.arrayElement([
      'ProgrammeLead',
      'HeadCoach',
      'AssistantCoach',
    ])
  },

  bio() {
    return faker.person.bio()
  },

  psa() {
    return 'https://www.psaworldtour.com/player/player-name/'
  },

  category() {
    return faker.helpers.arrayElement(['Junior', 'Adult'])
  },

  invite() {
    return faker.helpers.arrayElement(['InviteOnly', 'OpenToAll'])
  },

  start() {
    return dayjs().format('YYYY-MM-DD')
  },

  end() {
    const days = faker.number.int({ min: 1, max: 7 * 8 })
    return dayjs().add(days, 'day').format('YYYY-MM-DD')
  },

  maxPerSession() {
    return faker.number.int({ min: 5, max: 50 })
  },

  open() {
    return faker.helpers.arrayElement(['Open', 'Closed'])
  },

  launched() {
    return faker.helpers.arrayElement(['Launched', 'InDevelopment'])
  },

  description() {
    return faker.commerce.productDescription()
  },

  stripe() {
    return `${this.type}_XXX`
  },

  unitPrice() {
    return faker.number.float({ min: 10, max: 60, precision: 0.01 })
  },

  threshold() {
    return faker.number.int({ min: 1, max: 12 })
  },

  day() {
    return faker.date.weekday()
  },

  startTime() {
    const hour = dayjs().hour()
    return dayjs().hour(hour).minute(0).toISOString()
  },

  endTime() {
    return dayjs().add(1, 'hour').minute(40).toISOString()
  },

  note() {
    return faker.word.words({ count: faker.number.int({ min: 1, max: 15 }) })
  },

  date() {
    const future = faker.date.soon({
      days: faker.number.int({ min: 1, max: 10 }),
      refDate: dayjs(this.start()).toISOString(),
    })
    return dayjs(future).format('YYYY-MM-DD')
  },

  booking() {
    return faker.string.uuid()
  },

  time() {
    return dayjs().toISOString()
  },

  price() {
    return faker.number.float({ min: 20, max: 1000, precision: 0.01 })
  },

  quantity() {
    return faker.number.int({ min: 1, max: 30 })
  },

  some({ min, max, id, nid }) {
    const some = []
    if (!this.type) return some

    const n = faker.number.int({ min, max })
    for (let i = 0; i <= n; i++) {
      some.push(this[this.type](id, nid))
    }
    return some
  },
}

const Player = {
  ...Template,
  type: 'player',
  player() {
    return {
      name: this.name(),
      dob: this.dob(),
      email: this.email(),
      mobile: this.mobile(),
      member: this.member(),
      card: this.card(),
      image: this.image(),
      thumbnail: this.thumbnail(),
      notes: { create: [{ note: 'n0' }, { note: 'n1' }] },
    }
  },
}

const Coach = {
  ...Template,
  type: 'coach',

  coach() {
    return {
      name: this.name(),
      role: this.role(),
      email: this.email(),
      mobile: this.mobile(),
      bio: this.bio(),
      image: this.image(),
      thumbnail: this.thumbnail(),
    }
  },
}

const Alumni = {
  ...Template,
  type: 'alumni',

  alumni() {
    return {
      name: this.name(),
      email: this.email(),
      mobile: this.mobile(),
      psa: this.psa(),
      bio: this.bio(),
      image: this.image(),
      thumbnail: this.thumbnail(),
    }
  },
}

const Programme = {
  ...Template,
  type: 'programme',

  name() {
    return faker.company.name()
  },

  programme() {
    return {
      name: this.name(),
      category: this.category(),
      invite: this.invite(),
      start: this.start(),
      end: this.end(),
      maxPerSession: this.maxPerSession(),
      open: this.open(),
      launched: this.launched(),
      description: this.description(),
      image: this.image(),
      stripe: this.stripe(),
    }
  },
}

const Price = {
  ...Template,
  type: 'price',

  price(id) {
    return {
      programme: id,
      unitPrice: this.unitPrice(),
      threshold: this.threshold(),
      member: this.member(),
      stripe: this.stripe(),
    }
  },
}

const ProgrammeDay = {
  ...Template,
  type: 'programmeDay',

  programmeDay(id) {
    return {
      programme: id,
      day: this.day(),
      startTime: this.startTime(),
      endTime: this.endTime(),
    }
  },
}

const ProgrammeNote = {
  ...Template,
  type: 'programmeNote',

  programmeNote(id) {
    return {
      programme: id,
      note: this.note(),
    }
  },
}

const SessionNote = {
  ...Template,
  type: 'sessionNote',

  sessionNote(id) {
    return {
      programme: id,
      note: this.note(),
    }
  },
}

const PlayerNote = {
  ...Template,
  type: 'playerNote',

  playerNote(id) {
    return {
      programme: id,
      note: this.note(),
    }
  },
}
const ProgrammeCoach = {
  ...Template,
  type: 'programmeCoach',

  programmeCoach(pid, cid) {
    return {
      programme: pid,
      coach: cid,
    }
  },
}

const SessionAttendee = {
  ...Template,
  type: 'sessionAttendee',

  sessionAttendee(sid, pid) {
    return {
      session: sid,
      player: pid,
    }
  },
}

const SessionCoach = {
  ...Template,
  type: 'sessionCoach',

  sessionCoach(sid, cid) {
    return {
      session: sid,
      coach: cid,
    }
  },
}

const Session = {
  ...Template,
  type: 'session',

  session(pid) {
    return {
      programme: pid,
      date: this.date(),
      startTime: this.startTime(),
      endTime: this.endTime(),
      description: this.description(),
    }
  },
}

const Payment = {
  ...Template,
  type: 'payment',

  payment(prid, plid) {
    return {
      programme: prid,
      player: plid,
      booking: this.booking(),
      email: this.email(),
      date: this.date(),
      time: this.time(),
      price: this.price(),
      quantity: this.quantity(),
      unitPrice: this.unitPrice(),
      paymentType: this.paymentType(),
      stripe: this.stripe(),
    }
  },
}
export {
  Player,
  Coach,
  Alumni,
  Programme,
  Price,
  ProgrammeDay,
  ProgrammeNote,
  SessionNote,
  PlayerNote,
  ProgrammeCoach,
  SessionAttendee,
  SessionCoach,
  Session,
  Payment,
}
