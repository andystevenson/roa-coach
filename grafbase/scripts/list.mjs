import graphql from './graphql.mjs'
import { log } from 'node:console'
import { inspect } from 'node:util'

const Debug = true
export const listAll = async (typeName) => {
  const collection = `${typeName}Collection`

  let all = null
  let done = false

  let after = ''
  while (!done) {
    let query = `query ListSessions {
                  ${collection}(first: 100${after}) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    edges {
                      node {
                        id
                      }
                    }
                  }
                }`
    const next = await graphql(query)
    const { hasNextPage, endCursor } = next.data[collection].pageInfo
    done = !hasNextPage
    if (hasNextPage) {
      after = `, after: "${endCursor}"`
    }
    if (all) {
      // merge results
      all.data[collection].edges = all.data[collection].edges.concat(
        next.data[collection].edges,
      )
      all.data[collection].pageInfo = next.data[collection].pageInfo
    } else {
      all = next
    }
  }

  if (Debug) console.log(inspect(all, { colors: true, depth: null }))
  return all
}

export const listAllIds = async (typeName) => {
  const collection = `${typeName}Collection`
  const list = await listAll(typeName)
  const ids = list?.data[collection].edges.map((object) => object.node.id)
  if (Debug) console.log(inspect(ids, { colors: true, depth: null }))

  return ids
}

export const deleteMany = async (typeName, ids) => {
  // TODO: might have to batch this
  const query = `mutation DeleteMany {
                  ${typeName}DeleteMany(input: [
                    ${ids.map((id) => `{by: {id: "${id}"}}`).join(',')}
                  ]) {
                    deletedIds
                  }
                }`
  const list = await graphql(query)
  if (Debug) log(inspect(list, { colors: true, depth: null }))
  return list
}

export const deleteAll = async (typeName) =>
  await deleteMany(typeName, await listAllIds(typeName))

await deleteAll('sessionAttendee')
await deleteAll('attendee')
await listAllIds('attendee')
await listAllIds('sessionAttendee')
