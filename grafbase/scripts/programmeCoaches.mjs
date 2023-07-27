import graphql from './graphql.mjs'
import { log } from 'node:console'
import { inspect } from 'node:util'

export const createProgrammeCoaches = async (programmeId, coachIds) => {
  const query = `mutation CreateProgrammeCoaches {
                  programmeCoachCreateMany(input: [
                    ${coachIds
                      .map(
                        (coach) =>
                          `{input: {programme: {link: "${programmeId}"},  coach: {link: "${coach}"}}}`,
                      )
                      .join(',')}

                  ]) {
                    programmeCoachCollection {
                      id
                      programme {
                        id
                        name
                      }
                      coach {
                        id
                        name
                      }
                    }
                  }
                }`

  const programmeCoaches = await graphql(query)
  log(inspect(programmeCoaches, { colors: true, depth: null }))
  return programmeCoaches
}

const listAllProgrammeCoaches = async () => {}
const deleteAllProgrammeCoaches = async () => {}
