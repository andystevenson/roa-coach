import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat.js'
dayjs.extend(advancedFormat)

export const today = dayjs()

export const nextDay = (dayOfWeek, start = today) => {
  let day = start.startOf('day')
  while (day.day() !== dayOfWeek) day = day.add(1, 'day')
  return day
}

export const DaysOfWeek = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

export const nextDayOfWeek = (day, start = today) =>
  nextDay(
    DaysOfWeek.findIndex((weekday) => day.toLowerCase() === weekday),
    start,
  )

export const nextSunday = (start = today) => nextDay(0, start)
export const nextMonday = (start = today) => nextDay(1, start)
export const nextTuesday = (start = today) => nextDay(2, start)
export const nextWednesday = (start = today) => nextDay(3, start)
export const nextThursday = (start = today) => nextDay(4, start)
export const nextFriday = (start = today) => nextDay(5, start)
export const nextSaturday = (start = today) => nextDay(6, start)

// utilities
export const ordinalDate = (date) => {
  if (typeof date === 'string') return ordinalDate(dayjs(date))
  return date.format('dddd, Do MMMM, YYYY')
}
export const ordinalDateTime = (date) => {
  if (typeof date === 'string') return ordinalDateTime(dayjs(date))
  return date.format('dddd, Do MMMM, YYYY HH:mm:ss')
}

export const nearestDay = (...days) => {
  const nextDays = days
    .map((day) => nextDay(day))
    .sort((a, b) => {
      if (a.isBefore(b, 'day')) return -1
      if (a.isAfter(b, 'day')) return 1
      return 0
    })
  return nextDays
}

export const nearestDayOfWeek = (...days) => {
  const nextDaysOfWeek = days
    .map((day) => nextDayOfWeek(day))
    .sort((a, b) => {
      if (a.isBefore(b, 'day')) return -1
      if (a.isAfter(b, 'day')) return 1
      return 0
    })
  return nextDaysOfWeek
}

export const ascending = (a, b) => {
  if (a.isBefore(b, 'day')) return -1
  if (a.isAfter(b, 'day')) return 1
  return 0
}

export const descending = (a, b) => {
  if (a.isBefore(b, 'day')) return 1
  if (a.isAfter(b, 'day')) return -1
  return 0
}
