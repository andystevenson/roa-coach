import get from 'lodash.get'
import { log } from 'node:console'
import { inspect as utilInspect } from 'node:util'

export const inspect = (data, consoleFunction = log) =>
  consoleFunction(utilInspect(data, { colors: true, depth: null }))

export const nodesToData = (nodes) => nodes.map((object) => object.node)
export const edgesToData = (object) => {
  const length = Object.keys(object).length
  if ('edges' in object && length === 1) {
    let edges = nodesToData(object.edges)
    object = edges
    return object
  }

  for (const property in object) {
    // console.log({ property })
    if (typeof object[property] === 'object' && object[property] !== null) {
      object[property] = edgesToData(object[property])
    }
  }

  return object
}