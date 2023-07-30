// should really go in ajs/11ty.js
const { log } = require('console')
const { statSync } = require('fs')

module.exports = {
  title: (data) => {
    const { fileSlug } = data?.page
    const result = fileSlug ? `ROA - ${fileSlug}` : 'ROA'
    return result
  },
  script: (data) => {
    let src = `${data.page.fileSlug || 'ROA'}.js`
    let msrc = `${data.page.fileSlug || 'ROA'}.mjs`
    const stat = statSync(`./src/js/pages/${src}`, { throwIfNoEntry: false })
    const mstat = statSync(`./src/js/pages/${msrc}`, { throwIfNoEntry: false })
    msrc = mstat ? msrc : null
    src = stat ? src : null
    return msrc || src
  },
  site: 'https://roa.coach',
  company: 'ROA - Rob Owen Academy',
  description:
    'Rob Owen Academy is an excellent training environment for squash players of all ages looking to develop their game.',
  email: 'sam@westwarwicks.co.uk',
  telephone: '+447712398514',
}
