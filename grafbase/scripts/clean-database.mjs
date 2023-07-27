import graphql from './graphql.mjs'
import { log } from 'node:console'
import { inspect } from 'node:util'

log('clean-database')

import { listCoaches, createCoaches, deleteCoaches } from './coaches.mjs'

listCoaches()
