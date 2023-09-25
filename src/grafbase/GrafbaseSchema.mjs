import { readFileSync } from 'fs'
import Schema from './Schema.mjs'

const SchemaGraphQL = readFileSync('./grafbase/schema.graphql', 'utf-8')
const GrafbaseSchema = new Schema(SchemaGraphQL)
export default GrafbaseSchema
