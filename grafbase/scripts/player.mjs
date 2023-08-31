import graphql from './graphql.mjs'
import { inspect } from './utilities.mjs'
import {
  createPlayerNoteMany,
  deletePlayerNoteMany,
  updatePlayerNoteMany,
} from './playerNote.mjs'

const getThumbnail = (url) => {
  return url
}

export const listPlayer = async () => {
  const query = `query ListPlayer {
                  playerCollection(first: 100) {
                    edges {
                      node {
                        id
                        name
                        dob
                        email
                        mobile
                        member
                        card
                        image
                        thumbnail
                      }
                    }
                  }
                }`
  let result = await graphql(query)
  inspect({ result })
  return result
}

export const readPlayer = async ({ id }) => {
  const query = `query Player {
                  player(by: {id: "${id}"}) {
                    id
                    name
                    dob,
                    email
                    mobile
                    member
                    card
                    image
                    thumbnail
                    createdAt
                    updatedAt

                  }
                }`
  const read = await graphql(query)
  inspect({ read })
  return read
}

const validateInput = ({
  id,
  name,
  dob,
  email,
  mobile,
  member,
  card,
  image,
  thumbnail,
}) => {
  id = id?.trim() ? id.trim() : null
  name = name?.trim().replaceAll(/\s+/g, ' ').toLowerCase()
  dob = dob.trim()
  email = email?.trim()
    ? email.trim().replaceAll(/\s+/g, '').toLowerCase()
    : null
  mobile = mobile?.trim()
    ? mobile.trim().replaceAll(/\s+/g, '').toLowerCase()
    : null
  member =
    typeof member === 'string'
      ? member === 'true'
        ? true
        : false
      : member
      ? member
      : false
  card = card?.trim() ? card.trim() : null
  image = image?.trim() ? image.trim() : null
  thumbnail = thumbnail?.trim() ? thumbnail.trim() : getThumbnail(image)
  // console.log('validate', {
  //   id,
  //   name,
  //   email,
  //   mobile,
  //   member,
  //   card,
  //   image,
  //   thumbnail,
  // })
  return { id, name, dob, email, mobile, member, card, image, thumbnail }
}

const inputToNotes = (input, prefix = null) => {
  let notes = []

  if (!prefix) {
    for (const property in input) {
      if (property.startsWith('note.')) notes.push(input[property])
    }
    return notes
  }

  // we're looking at edited or deleted notes
  for (const property in input) {
    if (property.startsWith(prefix)) {
      const id = property.split('.')[1]
      const note = input[property]
      notes.push({ id, note })
    }
  }
  return notes
}

export const createPlayer = async (input) => {
  let { name, dob, email, mobile, member, card, image, thumbnail } =
    validateInput(input)

  const variables = { name, email, dob, mobile, member, card, image, thumbnail }

  console.log('CreatePlayer', { input, variables })
  const query = `mutation CreatePlayer(
                            $name: String!, 
                            $dob: Date!,
                            $email: Email, 
                            $mobile: String, 
                            $member: Boolean, 
                            $card: String, 
                            $image: URL,
                            $thumbnail: URL) {
                  playerCreate(
                    input: {
                      name: $name, 
                      dob: $dob,
                      email: $email, 
                      mobile: $mobile, 
                      member: $member, 
                      card: $card, 
                      image: $image, 
                      thumbnail: $thumbnail}
                  ) {
                    player {
                      id
                      name
                      dob,
                      email
                      mobile
                      member
                      card
                      image
                      thumbnail
                      createdAt
                      updatedAt
                    }
                  }
                }`
  const create = await graphql(query, variables)
  inspect({ create })
  const notes = inputToNotes(input)
  if (notes.length > 0) {
    const player = create.id
    const playerNotes = await createPlayerNoteMany(player, notes)
    inspect({ playerNotes })
  }
  return create
}

export const updatePlayer = async (input) => {
  let { id, name, dob, email, mobile, member, card, image, thumbnail } =
    validateInput(input)
  const variables = {
    id,
    name,
    dob,
    email,
    mobile,
    member,
    card,
    image,
    thumbnail,
  }

  const query = `mutation UpdatePlayerById(
                            $id: ID!, 
                            $name: String!,
                            $dob: Date!,
                            $email: Email, 
                            $mobile: String, 
                            $member: Boolean, 
                            $card: String, 
                            $image: URL,
                            $thumbnail: URL) {
                  playerUpdate(
                    by: {id: $id}
                    input: {
                      name: $name, 
                      dob: $dob,
                      email: $email, 
                      mobile: $mobile, 
                      member: $member, 
                      card: $card, 
                      image: $image,
                      thumbnail: $thumbnail
                    }
                  ) {
                    player {
                      id
                      name
                      dob
                      email
                      mobile
                      member
                      card
                      image
                      thumbnail
                    }
                  }
                }`

  const update = await graphql(query, variables)

  inspect({ update })
  return update
}

export const deletePlayer = async ({ id }) => {
  const query = `mutation PlayerDelete {
                  playerDelete(by: {id: "${id}"}) {
                    deletedId
                  }
                }`
  const playerNotes = await notes({ id })
  console.log('delete player notes', { playerNotes })
  await deletePlayerNoteMany(playerNotes.notes)
  const deleteMe = await graphql(query)
  inspect({ deleteMe })
  return deleteMe
}

export const readPlayerNotes = async ({ id }) => {
  const query = `query PlayerNotesById {
                  player(by: {id: "${id}"}) {
                    id
                    notes(first: 100) {
                      edges {
                        node {
                          id
                          note
                        }
                      }
                    }
                  }
                }`
  const read = await graphql(query)
  inspect({ read })
  return read
}

const notes = async (request) => {
  console.log('player.notes', { request })

  const { id } = request
  let update = false
  let notes = inputToNotes(request)
  if (notes.length > 0) {
    update = true
    const player = id
    console.log('createPlayerNoteMany', { player, notes })
    const newNotes = await createPlayerNoteMany(player, notes)
    inspect({ newNotes })
  }

  // do we have edited notes to update?
  notes = inputToNotes(request, 'edited.')
  if (notes.length > 0) {
    update = true

    console.log('updatePlayerNoteMany', { id, notes })
    const updatedNotes = await updatePlayerNoteMany(id, notes)
    inspect({ updatedNotes })
  }

  // do we have deleted notes to delete?
  notes = inputToNotes(request, 'deleted.')
  if (notes.length > 0) {
    update = true

    console.log('deletePlayerNoteMany', { id, notes })

    const playerNotes = await deletePlayerNoteMany(notes)
    inspect({ playerNotes })
  }

  if (!update) {
    // reading notes back
    const readBack = await readPlayerNotes({ id })
    console.log('just reading notes')
    inspect({ readBack })
    return readBack
  }
  return { 'player.notes': 'updated' }
}

export const Actions = {
  list: listPlayer,
  create: createPlayer,
  read: readPlayer,
  update: updatePlayer,
  delete: deletePlayer,
  notes,
}
