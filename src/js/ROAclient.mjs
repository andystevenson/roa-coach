import { GrafbaseClient, GrafbaseSchema } from '../grafbase/GrafbaseClient.mjs'
import { inspect } from '../grafbase/utilities.mjs'
import kebabCase from 'lodash.kebabcase'
import dayjs, { nextDayOfWeek } from '../grafbase/dates.mjs'

class ROAclient extends GrafbaseClient {
  constructor() {
    super(GrafbaseSchema)
    // collect some this.on()
    this.Player = this.actions.Player
    this.Coach = this.actions.Coach
    this.Alumni = this.actions.Alumni
    this.Programme = this.actions.Programme
    this.ProgrammeDay = this.actions.ProgrammeDay
    this.ProgrammeCoach = this.actions.ProgrammeCoach
    this.Session = this.actions.Session
    this.SessionCoach = this.actions.SessionCoach
    this.SessionAttendee = this.actions.SessionAttendee
    this.Payment = this.actions.Payment

    this.Alumni.on('create', this.alumniCreate.bind(this))
    this.Alumni.on('createMany', this.alumniCreateMany.bind(this))
    this.Programme.on('create', this.programmeCreate.bind(this))
    this.Programme.on('createMany', this.programmeCreateMany.bind(this))
    this.ProgrammeDay.on('create', this.programmeDayCreate.bind(this))
    this.ProgrammeDay.on('createMany', this.programmeDayCreateMany.bind(this))
    this.Session.on('create', this.sessionCreate.bind(this))
    this.Session.on('createMany', this.sessionCreateMany.bind(this))
  }

  // on Alumni.create() event, auto fill in the psa field to point psaworldtour.com player profile.
  async alumniCreate({ response }) {
    const { id, name } = response
    const psaName = kebabCase(name)
    const psa = `https://www.psaworldtour.com/player/${psaName}/`
    const updated = await this.Alumni.update({ id, psa })
    Object.assign(response, updated)
  }

  async alumniCreateMany({ response }) {
    const alumni = response
    for (const alumnus of alumni) {
      // have to rename alumnus to response to call programmeCreate()
      await this.alumniCreate({ response: alumnus })
    }
  }
  // programmeCreate({response})
  // Takes a look to see if any coaches were listed as part of the Programme.create() or
  // Programme.createMany() request. If there are no coaches listed then Programme.coaches()
  // is populated from all current coaches.

  async programmeCreate({ response }) {
    // If no coaches were added to the Programme during creation, add all the current coaches
    const programme = response
    const { id } = programme
    let programmeCoaches = await this.Programme.coaches(id)

    if (programmeCoaches.length > 0) {
      // Coaches populated manually, so nothing to do
      return programmeCoaches
    }

    // Programme.coaches is empty let's populate it with the current group of coaches
    const coaches = await this.Coach.ids()

    // populate programme coaches with the parameters to build a ProgrammeCoach.createMany request
    programmeCoaches = coaches.map((coach) => ({
      programme: id,
      coach: coach,
    }))

    const created = await this.ProgrammeCoach.createMany(programmeCoaches)
    if (created.length > 0) {
      programmeCoaches = await this.Programme.coaches(id)
      response.coaches = programmeCoaches
    }
  }

  async programmeCreateMany({ response }) {
    const programmes = response
    for (const programme of programmes) {
      // have to rename programme to response to call programmeCreate()
      await this.programmeCreate({ response: programme })
    }
  }

  // Takes a look at the session and if there are no coaches, updates it with the Programme.coaches()
  // This default ensures that Session.coaches() is propulated as a sensible default during
  // Session.create() or Session.createMany()
  async sessionCreate({ response }) {
    const session = response
    const { id, programme } = session
    let coaches = await this.Programme.coaches(programme.id)

    // if the session created it's own SessionCoach instances as part of Session.create() then skip
    // populating them from Programme.coaches()
    let sessionCoaches = await this.Session.coaches(id)
    if (sessionCoaches.length > 0) {
      return sessionCoaches
    }

    // if there are no Programme.coaches(), populate with the global coaches.

    if (coaches.length === 0) {
      coaches = await this.Coach.ids()
    }

    const manySessionCoaches = []
    for (const programmeCoach of coaches) {
      manySessionCoaches.push({
        session: id,
        coach: programmeCoach.coach ? programmeCoach.coach.id : programmeCoach,
      })
    }

    sessionCoaches = await this.SessionCoach.createMany(manySessionCoaches)
    if (sessionCoaches.length > 0) {
      session.coaches = sessionCoaches
    }
  }

  async sessionCreateMany({ response }) {
    const sessions = response
    for (const session of sessions) {
      // have to rename session to response to call sessionCreate()
      await this.sessionCreate({ response: session })
    }
  }

  // Populate a Programme.session() for each of the days selected between the start and end of the programme.
  async programmeDayCreate({ response }) {
    const programmeDay = response
    // inspect({ ['ProgrammeDay.create']: response })
    const pid = programmeDay.programme.id
    const programme = await this.Programme.read({ id: pid })

    const day = programmeDay.day
    const startTime = programmeDay.startTime
    const dStartTime = dayjs(startTime)
    const endTime = programmeDay.endTime
    const dEndTime = dayjs(endTime)

    const start = programme.start
    const dStart = dayjs(start)
    const end = programme.end
    const dEnd = dayjs(end)

    const sessionDays = []
    let nextDay = nextDayOfWeek(day, dStart)
    while (!nextDay.isAfter(dEnd)) {
      // set up the session detail
      const date = nextDay.format('YYYY-MM-DD')
      const startTime = nextDay
        .hour(dStartTime.hour())
        .minute(dStartTime.minute())
        .toISOString()
      const endTime = nextDay
        .hour(dEndTime.hour())
        .minute(dEndTime.minute())
        .toISOString()
      sessionDays.push({ date, startTime, endTime })
      nextDay = nextDayOfWeek(day, nextDay.add(1, 'day'))
    }
    const sessions = await this.Programme.sessions({
      id: pid,
      create: sessionDays,
    })
  }

  async programmeDayCreateMany({ response }) {
    const programmeDays = response
    for (const programmeDay of programmeDays) {
      // have to rename programmeDay to response to call programmeDayCreate()
      await this.programmeDayCreate({ response: programmeDay })
    }
  }
}

const client = new ROAclient()

export { client, ROAclient }
