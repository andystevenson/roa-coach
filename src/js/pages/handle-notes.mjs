import HandleDetails from './handle-details.mjs'

class HandleNotes extends HandleDetails {
  constructor(types) {
    const inputs = [{ model: 'note', property: 'note', type: 'textarea' }]
    super(types, inputs)
    console.log('HandleNotes', this)
  }
}

export default HandleNotes
