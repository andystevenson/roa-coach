import graphql from './graphql.mjs'
import { log } from 'node:console'
import { inspect } from 'node:util'

export const listCoaches = async () => {
  const query = `query ListCoaches {
                  coachCollection(first: 100) {
                    edges {
                      node {
                        name
                        email
                        mobile
                        id
                      }
                    }
                  }
                }`
  const list = await graphql(query)
  console.log(inspect(list, { colors: true, depth: null }))
  return list
}

export const deleteCoaches = async () => {
  const query = `mutation DeleteAllCoaches {
                  coachDeleteMany(input: [
                    {by: {name: "Rob Owen"}},
                    {by: {name: "Sam Osborne-Wylde"}},
                    {by: {name: "Jonah Bryant"}},
                    {by: {name: "James Averill"}}
                    {by: {name: "Rosie Kirsch"}}
                    
                  ]) {
                    deletedIds
                  }
                }`
  const list = await graphql(query)
  console.log(inspect(list, { colors: true, depth: null }))
  return list
}

export const createCoaches = async () => {
  const query = `mutation CreateAllCoaches {
                    coachCreateMany(input: [
                      {input: {name: "Rob Owen", email: "robowen2@icloud.com", mobile: "+447944345678"}},
                      {input: {name: "Sam Osborne-Wylde", email: "sam@westwarwicks.co.uk", mobile: "+447712398514"}},
                      {input: {name: "Jonah Bryant", email: "jonah@westwarwicks.co.uk", mobile: "+447495118582"}},
                      {input: {name: "James Averill", email: "Javerill84@gmail.com", mobile: "+447413480042"}},
                      {input: {name: "Rosie Kirsch", email: "Rosie.kirsch@yahoo.co.uk", mobile: "+447557771726"}},
                    ]) {
                      coachCollection {
                        name
                        email
                        mobile
                        id
                      }
                    }
                  }`
  const list = await graphql(query)
  console.log(inspect(list, { colors: true, depth: null }))
  return list
}

export const findCoachByName = async (name) => {
  const query = `query FindCoach {
                  coachSearch(first: 100, filter: {name: {eq: "${name}"}}) {
                    edges {
                      node {
                        id
                        name
                      }
                    }
                  }
                }`
  const list = await graphql(query)
  const id = list.data?.coachSearch?.edges[0]?.node.id
  log({ id })

  return id
}
