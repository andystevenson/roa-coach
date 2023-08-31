import './protected-page.mjs'
import layout from './modal-layout.mjs'
import handleLayout from './handle-layout.mjs'

const handleModal = (type) => {
  const { Elements, ImageElements } = layout(type)
  handleLayout(Elements, ImageElements)
}

export const modals = (handlers = {}) => {
  handleModal('create')
  handleModal('update')

  for (const property in handlers) {
    console.log('modals handling', property)
    const handler = handlers[property]
    handler(property)
  }
}

export default modals
