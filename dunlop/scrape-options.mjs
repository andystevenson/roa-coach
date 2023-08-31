import * as cheerio from 'cheerio'
import kebabCase from 'lodash.kebabcase'
import range from 'lodash.range'
import pkg from 'color-2-name'
const { closest } = pkg

const scrapeOptions = async (url) => {
  const file = await fetch(url)
  const html = await file.text()

  const $ = cheerio.load(html)
  let product = $('.product-data').html()
  let desc = $('.desc').text()
  let slides = $('.carousel img')
    .map(function (i, el) {
      // this === el
      return $(this).attr('src')
    })
    .toArray()
  slides = [...new Set(slides)]

  const productData = analyseProductData(product, desc)
  let { color } = productData
  let colors = colorizeSlides(slides, color)

  const result = { product, desc, colors, ...productData }
  return result
}

const LikelyColors = [
  'black',
  'blue',
  'cobalt',
  'green',
  'navy',
  'red',
  'white',
  'yellow',
  'gulf-coast',
  'water-garden',
  'mountain-spring',
  'raspberry',
  'blk-yell',
]

const DunlopColorMap = {
  'gulf-coast': '#145159',
  'water-garden': '#42B7A4',
  'mountain-spring': '#8196AC',
  raspberry: '#963A6A',
  'blk-yell': '#D9E963',
}

function colorizeSlides(slides, defaultColor) {
  const { name } = closest(defaultColor)
  if (slides.length < 1) return [{ color: name, image: defaultColor }]

  const result = slides.map((image) => {
    const parts = image.split('/')
    const filename = parts[parts.length - 1]
    const color = LikelyColors.find((color) =>
      kebabCase(filename.toLowerCase()).includes(color),
    )
    let result = null
    result = color ? { color, image } : { color: name, image }
    // if (result.color === 'unknown') console.log('colorizeSlides', result)
    return result
  })
  return result
}

const ClotheSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXL', 'XXXXL']

function rangeToSizes(rangeString) {
  rangeString = rangeString.replace(/\s/g, '')
  let start = null
  let end = null
  if (rangeString.includes('-')) {
    const parts = rangeString.split('-')
    start = parts[0]
    end = parts[1]
  }
  if (rangeString.includes('~')) {
    const parts = rangeString.split('~')
    start = parts[0]
    end = parts[1]
  }

  const startIndex = ClotheSizes.findIndex((size) => size === start)
  const endIndex = ClotheSizes.findIndex((size) => size === end)
  return ClotheSizes.slice(startIndex, endIndex + 1)
}

function analyseProductData(product, desc) {
  let color = '#000000'
  let sizes = rangeToSizes('S-XL')
  let fabric = '100% Polyester'
  let pack = 'one'

  if (product && product.includes('background-color:')) {
    color = product.split('background-color:')[1].split(';')[0]
    // console.log('splitting color', color, product)
  }

  if (desc && desc.includes('One size')) {
    let [descPart, fabricPart, sizePart] = desc.split('.')
    if (!sizePart) {
      sizePart = fabricPart
      fabricPart = descPart
    }

    sizes = [sizePart.trim().toLowerCase()]
    fabric = fabricPart.trim()
    return { sizes, fabric, color, pack }
  }

  if (desc && desc.includes('Available in')) {
    let [fabricPart, sizesPart, packPart] = desc.split('.')
    // console.log({ fabricPart, sizesPart, packPart })
    sizesPart = sizesPart
      .replace('Available in sizes in ', '')
      .replace('Available in EU sizes ', '')
      .replace('Available in sizes ', '')
      .replace('-', '~')
      .replace(/\s/g, '')
      .trim()

    const simpleProduct = `${sizesPart}<br>${fabricPart}`
    // console.log({ simpleProduct })
    if (packPart) {
      // we need to preserve this from recursion
      const result = analyseProductData(simpleProduct, '')
      fabric = result.fabric
      sizes = result.sizes
      pack = packPart.trim()
      // console.log({ sizes, fabric, color, pack })
      return { sizes, fabric, color, pack }
    }

    return { ...analyseProductData(simpleProduct, ''), color }
  }

  const numberRange = new RegExp('^[0-9]+\\s?~')
  const percentageStart = new RegExp('^[0-9]+%')

  if (product?.startsWith('S') || product?.startsWith('X')) {
    const parts = product.split('<br>')
    // console.log({ parts })
    fabric = parts[1] ? parts[1] : fabric
    sizes = rangeToSizes(parts[0])
  }

  if (product && numberRange.test(product)) {
    const parts = product.split('<br>')
    fabric = parts[1] ? parts[1] : fabric
    let rangeStartEnd = parts[0].replace(/\s/g, '')

    const [start, end] = rangeStartEnd.split('~')

    sizes = +start < 128 ? range(+start, +end + 1) : range(+start, +end + 1, 6)
  }

  if (product && percentageStart.test(product)) {
    const parts = product.split('<br>')
    // swap the parts around and recurse
    return { ...analyseProductData(`${parts[1]}<br>${parts[0]}`, ''), color }
  }

  if (product && product.includes('</span><br>')) {
    const parts = product.split('</span><br>')
    // console.log('span.br', { parts })
    return { ...analyseProductData(parts[1], ''), color }
  }

  if (fabric && fabric.startsWith('FABRIC:')) {
    fabric = fabric.replace(/^FABRIC:/, '').trim()
  }
  // console.log({ sizes, fabric, color, pack })
  return { sizes, fabric, color, pack }
}
export default scrapeOptions

scrapeOptions(
  'https://dunlopsports.com/products/squash/apparel/soft-shell-jacket-essentials-line/',
)
