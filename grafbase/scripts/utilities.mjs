import get from 'lodash.get'
import { log } from 'node:console'
import { inspect as utilInspect } from 'node:util'

export const inspect = (data, consoleFunction = log) =>
  consoleFunction(utilInspect(data, { colors: true, depth: null }))

export const dataFromSearch = (queryResult, typeName) => {
  const edges = get(queryResult, `data.${typeName}Search.edges`)
  return edges && edges.length > 0 ? edges : null
}

export const dataFromSearchFieldCollection = (
  queryResult,
  typeName,
  fieldName,
  transform = (object) => object,
) => {
  const edges = dataFromSearch(queryResult, typeName)
  if (edges)
    return nodesToData(get(edges[0], `node.${fieldName}.edges`)).map(transform)
  return []
}

export const nodesToData = (nodes) => nodes.map((object) => object.node)
