import pluralize from 'pluralize'
import capitalize from 'lodash.capitalize'

export const Pathname = window.location.pathname
export const Page = Pathname.slice(1, Pathname.lastIndexOf('/'))
export const Type = capitalize(Page)
export const Title = pluralize.singular(Page)
export const Api = `/api/roa`
