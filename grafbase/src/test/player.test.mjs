import client from '../GrafbaseClient.mjs'

const create = {
  action: 'create',
  type: 'Player',
  name: 'Andy Stevenson',
  dob: '1964-01-30',
}

const update = {
  action: 'update',
  type: 'Player',
  email: 'andystevenson@mac.com',
}

const read = {
  action: 'read',
  type: 'Player',
}

const deleteOne = {
  action: 'delete',
  type: 'Player',
}

async function run() {
  let result = await client.invoke(create)
  console.log('create', result)

  const { id } = result

  result = await client.invoke({ id, ...update })
  console.log('update', result)

  result = await client.invoke({ id, ...read })
  console.log('read', result)

  result = await client.invoke({ id, ...deleteOne })
  console.log('delete', result)
}

run()
