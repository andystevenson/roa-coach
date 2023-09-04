import HandleDetails from './handle-details.mjs'

class HandlePrices extends HandleDetails {
  constructor(types) {
    const inputs = [
      { model: 'price', property: 'unitPrice', type: 'float' },
      { model: 'price', property: 'threshold', type: 'int' },
      { model: 'price', property: 'members', type: 'boolean', value: true },
    ]
    super(types, inputs)
    console.log('HandlePrices', this)
  }
}

export default HandlePrices
