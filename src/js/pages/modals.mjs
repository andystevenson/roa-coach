import './protected-page.mjs'
import layout from './modal-layout.mjs'
import handleLayout from './handle-layout.mjs'

const handleModal = (type) => {
  const { Elements, ImageElements } = layout(type)
  handleLayout(Elements, ImageElements)
}

handleModal('create')
handleModal('update')
