import graphql from './graphql.mjs'
import { inspect } from './utilities.mjs'

const getThumbnail = (url) => {
  return url
}

export const listCoach = async () => {
  const query = `query ListCoach {
                  coachCollection(first: 100) {
                    edges {
                      node {
                        id
                        name
                        role
                        email
                        mobile
                        bio
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

export const readCoach = async ({ id }) => {
  const query = `query Coach {
                  coach(by: {id: "${id}"}) {
                    id
                    name
                    role
                    email
                    mobile
                    bio
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
  role,
  email,
  mobile,
  bio,
  image,
  thumbnail,
}) => {
  id = id?.trim() ? id.trim() : null
  name = name?.trim().replaceAll(/\s+/g, ' ').toLowerCase()
  role = role?.trim() ? role.trim() : null
  email = email?.trim()
    ? email.trim().replaceAll(/\s+/g, '').toLowerCase()
    : null
  mobile = mobile?.trim()
    ? mobile.trim().replaceAll(/\s+/g, '').toLowerCase()
    : null
  bio = bio?.trim() ? bio.trim() : null
  image = image?.trim() ? image.trim() : null
  thumbnail = thumbnail?.trim() ? thumbnail.trim() : getThumbnail(image)
  // console.log('validate', {
  //   id,
  //   name,
  //   role,
  //   email,
  //   mobile,
  //   bio,
  //   image,
  //   thumbnail,
  // })
  return { id, name, role, email, mobile, bio, image, thumbnail }
}

export const createCoach = async (input) => {
  let { name, role, email, mobile, bio, image, thumbnail } =
    validateInput(input)

  const variables = { name, role, email, mobile, bio, image, thumbnail }

  const query = `mutation CreateCoach(
                            $name: String!,
                            $role: Role,
                            $email: Email, 
                            $mobile: String, 
                            $bio: String, 
                            $image: URL,
                            $thumbnail: URL) {
                  coachCreate(
                    input: {
                      name: $name, 
                      role: $role,
                      email: $email, 
                      mobile: $mobile, 
                      bio: $bio, 
                      image: $image, 
                      thumbnail: $thumbnail}
                  ) {
                    coach {
                      id
                      name
                      role
                      email
                      mobile
                      bio
                      image
                      thumbnail
                      createdAt
                      updatedAt
                    }
                  }
                }`
  const create = await graphql(query, variables)
  inspect({ create })
  return create
}

export const updateCoach = async (input) => {
  let { id, name, role, email, mobile, bio, image, thumbnail } =
    validateInput(input)
  const variables = { id, name, role, email, mobile, bio, image, thumbnail }

  const query = `mutation UpdateCoachById(
                            $id: ID!, 
                            $name: String!, 
                            $role: Role,
                            $email: Email, 
                            $mobile: String, 
                            $bio: String, 
                            $image: URL,
                            $thumbnail: URL) {
                  coachUpdate(
                    by: {id: $id}
                    input: {
                      name: $name, 
                      role: $role,
                      email: $email, 
                      mobile: $mobile, 
                      bio: $bio, 
                      image: $image,
                      thumbnail: $thumbnail
                    }
                  ) {
                    coach {
                      id
                      name
                      role
                      email
                      mobile
                      bio
                      image
                      thumbnail
                    }
                  }
                }`

  const update = await graphql(query, variables)
  inspect({ update })
  return update
}

export const deleteCoach = async ({ id }) => {
  const query = `mutation CoachDelete {
                  coachDelete(by: {id: "${id}"}) {
                    deletedId
                  }
                }`
  const deleteMe = await graphql(query)
  inspect({ deleteMe })
  return deleteMe
}

export const Actions = {
  list: listCoach,
  create: createCoach,
  read: readCoach,
  update: updateCoach,
  delete: deleteCoach,
}
