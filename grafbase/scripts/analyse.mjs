const pathExcludes = [
  'Collection',
  'Create',
  'CreateMany',
  'Update',
  'UpdateMany',
  'Delete',
  'DeleteMany',
  'Search',
]

const ReplaceRegex = new RegExp(pathExcludes.join('|'))
const objectName = (path) => {
  return path.replace(ReplaceRegex, '')
}

const parseParts = (message) => {
  // nasty hack because error messages have different formats between create and update
  const duplicate = message.includes('is already taken on field')
  let parts = message.match(/(?<=\")(.*?)(?=\")/g)
  let name = parts ? parts[0] : null
  if (parts && parts.length < 3) {
    // message doesn't have expected format
    parts = [...message.matchAll(/The value (\S+?)\s/g)]
    name = parts && parts.length === 2 ? parts[1] : null
  }
  return { duplicate, name, parts }
}

export const analyse = (errors = []) => {
  if (errors.length === 0) return { reason: 'nothing', cause: 'nothing' }
  if (errors.length === 1) {
    let { path, message } = errors[0]
    path = path ? path[0] : null
    let object = path ? objectName(path) : null
    return {
      path: path,
      cause: message,
      object,
      ...parseParts(message),
    }
  }
}

export default analyse
