// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
import { listProgrammesNames } from '../../../grafbase/scripts/programmes.mjs'
const handler = async (event) => {
  try {
    const programmes = await listProgrammesNames()
    return {
      statusCode: 200,
      body: JSON.stringify(programmes),
    }
  } catch (error) {
    return { statusCode: 500, body: error.toString() }
  }
}

export { handler }
