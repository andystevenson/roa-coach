// listen for
import kebabCase from 'lodash.kebabcase'
import client from './GrafbaseClient.mjs'
const emitter = client.emitter

emitter.on('error', (error) => {
  console.error('GrafbaseEvents', error)
})

emitter.on('Alumni.create', async ({ request, response }) => {
  const { type } = request
  const { id, name } = response
  const psaName = kebabCase(name)
  const psa = `https://www.psaworldtour.com/player/${psaName}/`
  const action = 'update'
  const updatePsa = { action, type, id, psa }
  const result = await client.invoke(updatePsa)
})
