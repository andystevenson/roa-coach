const { htmlAttributes } = require('@andystevenson/lib/html')

const isString = (arg) => typeof arg === 'string' || arg instanceof String
module.exports = function link(...args) {
  if (args.length < 1)
    throw SyntaxError('link expects at least 1 arguments[link-object]')
  const value = args[0]
  // value needs to be an object
  let type = typeof value
  if (type !== 'object') {
    throw TypeError(
      `link expects an object as its 1st argument, got [typeof=${type},${value}] instead`,
    )
  }

  // index the arguments
  let next = 1

  // did they pass any link text
  let linkText = ''
  if (isString(args[next]) && !args[next].startsWith('?')) {
    // assume this argument is linkText
    linkText = args[next].toString()
    next = next + 1
  }

  // argument could be parameters for the link href
  let params = ''
  if (isString(args[next]) && args[next].startsWith('?')) {
    params = args[next].toString()
    next = next + 1
  }

  const {
    description: title,
    href,
    description: alt,
    image,
    description,
  } = value

  const aAttributes = htmlAttributes({
    'aria-label': description,
    href: `${href}${params}`,
    alt,
    title,
  })

  let { url: src, width, height, description: imgDescription } = image
  // edge case... if width and height are passed as attributes then they are meant to be
  // overriding the img width/height

  const extras = args[args.length - 1]
  if (typeof extras === 'object' && '__keywords' in extras) {
    if ('width' in extras) width = extras.width
    if ('height' in extras) height = extras.height
    // delete them because the do not apply to the a(link) object
    delete extras.width
    delete extras.height
  }

  const aExtraAttributes = htmlAttributes(args.slice(next))

  const imgAttributes = htmlAttributes({
    'aria-hidden': true,
    src,
    width,
    height,
    title: imgDescription,
  })

  const template = `<a ${aAttributes} ${aExtraAttributes}>${linkText}<img ${imgAttributes}></a>`
  return template
}
