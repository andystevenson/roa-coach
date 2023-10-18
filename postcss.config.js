const postcssJitProps = require('postcss-jit-props')
const postcssCustomMedia = require('postcss-custom-media')
const openProps = require('open-props')

/* eslint-disable global-require, import/no-extraneous-dependencies */
const postcssConfig = {
  plugins: [
    postcssJitProps(openProps),
    postcssCustomMedia(),
    require('autoprefixer'),
  ],
}

module.exports = postcssConfig
// module.exports = { plugins: [postcssCustomMedia()] }
