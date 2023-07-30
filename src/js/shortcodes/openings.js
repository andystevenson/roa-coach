const util = require('node:util')

const render = (el) => {
  const open = `<${el.element}${el.id ? ' id="' + el.id + '"' : ''}${
    el.class ? ' class="' + el.class + '"' : ''
  }${el.href ? ' href="' + el.href + '"' : ''}>`
  const close = `</${el.element}>`
  const children = el.children ? el.children.map((child) => render(child)) : ''
  const value = el.value ? el.value : ''
  return [open, children, value, close].filter((empty) => empty)
}

module.exports = function openings(xls) {
  let s = util.inspect(render(xls), { depth: null })
  s = s.replace(/\[|\]/g, '')
  s = s.replace(/'/g, '')
  s = s.replace(/>, /g, '>')
  s = s.replace(/, </g, '<')
  s = s.replace(/> ,/g, '>')
  s = s.replace(/> \n/g, '>\n')
  s = s.replace(/,\n/g, '\n')
  s = s.replace(/\s+$/g, '')
  return s
}
