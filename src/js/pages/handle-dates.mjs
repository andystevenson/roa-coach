import HandleDetails from './handle-details.mjs'

class HandleDates extends HandleDetails {
  constructor(types) {
    const inputs = [
      { model: 'date', property: 'date', type: 'date' },
      { model: 'date', property: 'day', type: 'day-of-week' },
      { model: 'date', property: 'startTime', type: 'time', required: true },
      { model: 'date', property: 'endTime', type: 'time', required: true },
      { model: 'date', property: 'repeatable', type: 'boolean' },
    ]
    super(types, inputs)
    console.log('HandleDates', this)
  }
}

export default HandleDates
