import * as cheerio from 'cheerio'

const scrapeOptions = async (url) => {
  const file = await fetch(url)
  const html = await file.text()

  const $ = cheerio.load(html)
  const $size = $('#pa_size')
  const sizes = []
  $size.children().each(function () {
    sizes.push($(this).text())
  })

  const $colour = $('#pa_colour')
  const colors = []
  $colour.children().each(function () {
    colors.push($(this).text())
  })

  // remove 'Choose an option'
  sizes.shift()
  colors.shift()
  // console.log({ sizes, colors })
  if (sizes.length === 0) sizes.push('S', 'M', 'L', 'XL', '2XL')
  return { sizes, colors }
}

export default scrapeOptions
// scrapeOptions(
//   'https://www.iprosports.co.uk/product/west-warwicks-childrens-classic-shorts/',
// )
