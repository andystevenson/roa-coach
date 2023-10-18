const postcssJitProps = require('postcss-jit-props')
const postcssCustomMedia = require('postcss-custom-media')
const openProps = require('open-props')

const postcssConfig = {
  plugins: [
    postcssJitProps(openProps),
    postcssCustomMedia(),
    require('autoprefixer'),
  ],
}

module.exports = postcssConfig
