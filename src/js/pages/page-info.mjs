import pluralize from 'pluralize'
export const Pathname = window.location.pathname
export const Page = Pathname.slice(1, Pathname.lastIndexOf('/'))
export const Title = pluralize.singular(Page)
export const Api = `/api/roa-${Page}`
