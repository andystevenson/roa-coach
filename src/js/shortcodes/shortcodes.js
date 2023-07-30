const safetify = require('@andystevenson/lib/safetify')
const isAsyncFunction = require('@andystevenson/lib/isAsyncFunction')
const iconc = require('./iconc')
const linkc = require('./linkc')
const imgc = require('./imgc')
const openings = require('./openings')

const localShortcodes = {
  iconc,
  linkc,
  imgc,
  openings,
}
const safeShortcodes = {}
for (const fn in localShortcodes) {
  safeShortcodes[fn] = safetify(localShortcodes[fn])
}

const shortcodes = {
  ...safeShortcodes,
}

module.exports = (eleventyConfig) => {
  for (const shortcode in shortcodes) {
    const fn = shortcodes[shortcode]
    const isAsync = isAsyncFunction(fn)
    isAsync
      ? eleventyConfig.addAsyncShortcode(shortcode, fn)
      : eleventyConfig.addShortcode(shortcode, fn)
    eleventyConfig.addNunjucksGlobal(shortcode, fn)
  }
}
