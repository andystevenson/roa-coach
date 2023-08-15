import graphql from './graphql.mjs'
import { inspect } from './utilities.mjs'
import kebabCase from 'lodash.kebabcase'

const getPsa = (name) => {
  const player = kebabCase(name)
  const url = `https://www.psaworldtour.com/player/${player}/`
  // const response = await fetch(url)
  // const redirected = response.redirected
  // const result = redirected ? null : url
  // console.log('getPsa', { url, redirected, result })
  return url
}

const getThumbnail = (url) => {
  return url
}

export const listAlumni = async () => {
  const query = `query ListAlumni {
                  alumniCollection(first: 100) {
                    edges {
                      node {
                        id
                        name
                        email
                        mobile
                        bio
                        psa
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

export const readAlumni = async ({ id }) => {
  const query = `query Alumni {
                  alumni(by: {id: "${id}"}) {
                    id
                    name
                    email
                    mobile
                    bio
                    psa
                    image
                    thumbnail
                  }
                }`
  const read = await graphql(query)
  inspect({ read })
  return read
}

const validateInput = ({
  id,
  name,
  email,
  mobile,
  bio,
  psa,
  image,
  thumbnail,
}) => {
  id = id?.trim() ? id.trim() : null
  name = name?.trim().replaceAll(/\s+/g, ' ').toLowerCase()
  email = email?.trim()
    ? email.trim().replaceAll(/\s+/g, '').toLowerCase()
    : null
  mobile = mobile?.trim()
    ? mobile.trim().replaceAll(/\s+/g, '').toLowerCase()
    : null
  bio = bio?.trim() ? bio.trim() : null
  psa = psa?.trim() ? psa.trim() : getPsa(name)
  image = image?.trim() ? image.trim() : null
  thumbnail = thumbnail?.trim() ? thumbnail.trim() : getThumbnail(image)
  console.log('validate', {
    id,
    name,
    email,
    mobile,
    bio,
    psa,
    image,
    thumbnail,
  })
  return { id, name, email, mobile, bio, psa, image, thumbnail }
}

export const createAlumni = async (input) => {
  let { name, email, mobile, bio, psa, image, thumbnail } = validateInput(input)

  const variables = { name, email, mobile, bio, psa, image, thumbnail }

  const query = `mutation CreateAlumni(
                            $name: String!, 
                            $email: Email, 
                            $mobile: String, 
                            $bio: String, 
                            $psa: URL, 
                            $image: URL,
                            $thumbnail: URL) {
                  alumniCreate(
                    input: {
                      name: $name, 
                      email: $email, 
                      mobile: $mobile, 
                      bio: $bio, 
                      psa: $psa, 
                      image: $image, 
                      thumbnail: $thumbnail}
                  ) {
                    alumni {
                      id
                      name
                      email
                      mobile
                      bio
                      psa
                      image
                      thumbnail
                    }
                  }
                }`
  const create = await graphql(query, variables)
  inspect({ create })
  return create
}

export const updateAlumni = async (input) => {
  let { id, name, email, mobile, bio, psa, image, thumbnail } =
    validateInput(input)
  const variables = { id, name, email, mobile, bio, psa, image, thumbnail }

  const query = `mutation UpdateAlumniById(
                            $id: ID!, 
                            $name: String!, 
                            $email: Email, 
                            $mobile: String, 
                            $bio: String, 
                            $psa: URL, 
                            $image: URL,
                            $thumbnail: URL) {
                  alumniUpdate(
                    by: {id: $id}
                    input: {
                      name: $name, 
                      email: $email, 
                      mobile: $mobile, 
                      bio: $bio, 
                      psa: $psa, 
                      image: $image,
                      thumbnail: $thumbnail
                    }
                  ) {
                    alumni {
                      id
                      name
                      email
                      mobile
                      bio
                      psa
                      image
                      thumbnail
                    }
                  }
                }`

  const update = await graphql(query, variables)
  inspect({ update })
  return update
}

export const deleteAlumni = async ({ id }) => {
  const query = `mutation AlumniDelete {
                  alumniDelete(by: {id: "${id}"}) {
                    deletedId
                  }
                }`
  const deleteMe = await graphql(query)
  inspect({ deleteMe })
  return deleteMe
}

export const Actions = {
  list: listAlumni,
  create: createAlumni,
  read: readAlumni,
  update: updateAlumni,
  delete: deleteAlumni,
}
