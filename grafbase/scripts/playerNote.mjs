import graphql from './graphql.mjs'
import { inspect } from './utilities.mjs'

export const listPlayerNote = async () => {
  const query = `query ListPlayerNote {
                  playerNoteCollection(first: 100) {
                    edges {
                      node {
                        id
                        player
                        note
                      }
                    }
                  }
                }`
  let result = await graphql(query)
  inspect({ result })
  return result
}

export const readPlayerNote = async ({ id }) => {
  const query = `query PlayerNote {
                  playerNote(by: {id: "${id}"}) {
                    id
                    player
                    note
                  }
                }`
  const read = await graphql(query)
  inspect({ read })
  return read
}

export const createPlayerNote = async (input) => {
  const { player, note } = input
  const variables = { player, note }

  const query = `mutation CreatePlayerNote(
                            $player: ID!, 
                            $note: String!) {
                  playerNoteCreate(
                    input: {
                      player: $player, 
                      note: $note}
                  ) {
                    playerNote {
                      id
                      player
                      note
                      createdAt
                    }
                  }
                }`
  const create = await graphql(query, variables)
  inspect({ create })
  return create
}

export const createPlayerNoteManyMutation = (player, notes) => {
  const inputs = notes
    .map((note) => `{input:{player: {link: "${player}"}, note: "${note}"}}`)
    .join(',')
  const query = `mutation PlayerNoteCreateMany {
	                playerNoteCreateMany(input: [${inputs}]) {
                    playerNoteCollection {
                      id
                      player {
                        name
                      }
                      note
                    }
                  }
                }`
  return query
}

export const createPlayerNoteMany = async (player, notes) => {
  const query = createPlayerNoteManyMutation(player, notes)
  const create = await graphql(query)
  inspect({ create })
  return create
}

export const updatePlayerNote = async (input) => {
  let { id, player, note } = input
  const variables = { id, player, note }

  const query = `mutation UpdatePlayerNoteById(
                            $id: ID!, 
                            $player: ID!, 
                            $note: String!) {
                  playerNoteUpdate(
                    by: {id: $id}
                    input: {
                      player: $player, 
                      note: $note, 
                    }
                  ) {
                    playerNote {
                      id
                      player
                      note
                    }
                  }
                }`

  const update = await graphql(query, variables)
  inspect({ update })
  return update
}

export const deletePlayerNote = async ({ id }) => {
  const query = `mutation PlayerNoteDelete {
                  playerNoteDelete(by: {id: "${id}"}) {
                    deletedId
                  }
                }`
  const deleteMe = await graphql(query)
  inspect({ deleteMe })
  return deleteMe
}

const deletePlayerNoteManyMutation = (notes) => {
  const inputs = notes.map((note) => `{by: {id: "${note.id}"}}`).join(',')
  const query = `mutation PlayerNoteDeleteMany {
                    playerNoteDeleteMany(input: [${inputs}]) {
                      deletedIds
                    }
                  }`
  return query
}

export const deletePlayerNoteMany = async (notes) => {
  const query = deletePlayerNoteManyMutation(notes)
  const dpnm = await graphql(query)
  inspect({ dpnm, query })
  return dpnm
}

const updatePlayerNoteManyMutation = (player, notes) => {
  const template =
    'input: [{by: {id: "playernote_01H8HK6GE3Q78PYWEBP1D223BM"}, input: {note: "updated note"}}'
  const inputs = notes
    .map((note) => `{by: {id: "${note.id}"}, input: {note: "${note.note}"}}`)
    .join(',')
  const query = `mutation PlayerNoteUpdateMany {
                  playerNoteUpdateMany(input: [${inputs}]) {
                    playerNoteCollection {
                      id
                    }
                  }
                }`

  return query
}

export const updatePlayerNoteMany = async (player, notes) => {
  const query = updatePlayerNoteManyMutation(player, notes)
  const update = await graphql(query)
  inspect({ update })
  return update
}

export const Actions = {
  list: listPlayerNote,
  create: createPlayerNote,
  read: readPlayerNote,
  update: updatePlayerNote,
  delete: deletePlayerNote,
}

// await deletePlayerNoteMany([{ id: 'playernote_01H89SAA7GQ07NT8MXNPMRRZG8' }])
