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
    const { name, image, page } = request
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
    const [fullPath, asset, version, filename] = parts
    uploaded.optimised = `${asset}f_auto,q_auto/${version}${filename}`
    uploaded.portrait = `${asset}c_fill,f_auto,g_face:center,q_auto/${version}${filename}`
    uploaded.thumbnail = `${asset}c_fill,f_auto,g_face:center,h_250,q_auto,w_250/${version}${filename}`
    uploaded.banner = `${asset}c_fill,g_auto,h_150,w_600/${version}${filename}`
    console.log({
      name,
      kebabed,
      page,
      uploaded,
      parts,
      fullPath,
      asset,
      version,
      filename,
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
