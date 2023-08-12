// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
import 'dotenv/config'
import { v2 as cloudinary } from 'cloudinary'
import kebabCase from 'lodash.kebabcase'

const functionName = 'cloudinary-upload'
const handler = async ({ httpMethod, body }) => {
  try {
    const post = httpMethod === 'POST'
    if (!post) {
      const error = { error: 'POST request expected' }
      console.error(`${functionName} failed`, error)
      return {
        statusCode: 400,
        body: JSON.stringify(error),
      }
    }

    const request = JSON.parse(body)
    const { name, image, page, pathname, title } = request
    const kebabed = kebabCase(name)
    const uploaded = await cloudinary.uploader.upload(image, {
      public_id: kebabed,
      folder: `/roa/${page}`,
    })
    // annotate the response with an optimised url
    const pathRegex = /(.*\/upload\/)(\S+?)(\/.*)/
    const url = uploaded.url
    let path = url.slice(0, url.lastIndexOf('.'))

    const parts = path.match(pathRegex)
    uploaded.optimised = `${parts[1]}f_auto,q_auto/v1${parts[3]}`
    uploaded.portrait = `${parts[1]}c_fill,f_auto,g_face:center,h_600,q_auto,w_300/v1${parts[3]}`
    uploaded.thumbnail = `${parts[1]}c_fill,f_auto,g_face:center,h_250,q_auto,w_250/v1${parts[3]}`
    uploaded.banner = `${parts[1]}c_fill,g_auto,h_150,w_600/v1${parts[3]}`
    console.log({
      name,
      kebabed,
      page,
      pathname,
      title,
      uploaded,
      parts,
      image: image.slice(0, 40),
    })
    // const attendees = await listAttendees(programme)
    // console.log(`${functionName} success`, attendees)

    return {
      statusCode: 200,
      body: JSON.stringify(uploaded),
    }
  } catch (error) {
    console.error(`${functionName} failed`, error)
    return { statusCode: 500, body: error.toString() }
  }
}

export { handler }
