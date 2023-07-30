const { htmlAttributes } = require('@andystevenson/lib/html')

module.exports = function icon(...args) {
  // console.log('iconc', args)
  if (args.length < 1)
    throw SyntaxError('icon expects at least 1 argument [icon-object]')

  const object = args[0]
  // object needs to be typeof === 'object'
  let type = typeof object
  if (type !== 'object') {
    throw TypeError(
      `icon expects an object as its 1st argument, got [typeof=${type},${object}] instead`,
    )
  }

  // look to see if any of these have been overridden
  let { url, width, height, description } = object
  let title = description
  let alt = description
  let loading = 'lazy'

  // edge case... if width and height are passed as attributes then they are meant to be
  // overriding the img width/height
  const src =
    url.endsWith('.webp') || url.endsWith('.svg') ? url : `${url}?fm=webp`

  const extras = args[args.length - 1]
  if (typeof extras === 'object' && '__keywords' in extras) {
    if ('width' in extras) width = extras.width
    if ('height' in extras) height = extras.height
    if ('title' in extras) title = extras.title
    if ('alt' in extras) alt = extras.alt
    if ('loading' in extras) loading = extras.loading
    // delete them because the do not apply to the a(link) object
    delete extras.width
    delete extras.height
    delete extras.title
    delete extras.alt
    delete extras.loading
  }

  const imgAttributes = htmlAttributes({
    'aria-hidden': true,
    src,
    width,
    height,
    title,
    alt,
    loading,
  })

  let next = 1
  const others = htmlAttributes(args.slice(next))

  const template = `<img ${imgAttributes} ${others}>`
  return template
}
