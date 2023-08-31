import * as cheerio from 'cheerio'
import scrapeOptions from './scrape-options.mjs'

const SquashCategories = [
  'rackets',
  'balls',
  'bags',
  'strings',
  'accessories',
  'apparel',
]

const TennisCategories = [
  'rackets',
  'balls',
  'bags',
  'strings',
  'accessories',
  'apparel',
  'slinger',
]

const company = 'dunlop'

const AllCategories = {
  squash: SquashCategories,
  tennis: TennisCategories,
}

const scrape = async (sport, category) => {
  const URL = `https://dunlopsports.com/products/${sport}/${category}/`

  const file = await fetch(URL)
  const doc = await file.text()

  const $ = cheerio.load(doc)
  let products = []
  $('.product').each(function () {
    const link = $(this).attr('data-url')
    const main = $(this).find('.main').attr('src')
    const over = $(this).find('.over').attr('src')
    const title = $(this).find('h3').text()
    const subtitle = $(this).find('.subtitle').text()
    const description = $(this).find('.desc').text()
    const price = '£0'
    const product = {
      company,
      sport,
      category,
      link,
      main,
      over,
      title,
      subtitle,
      description,
      price,
    }
    products.push(product)
  })

  // special case for apparel... read off the sizes
  if (category === 'apparel') {
    let productsWithOptions = []
    for (let product of products) {
      const { link } = product
      product = { ...product, ...(await scrapeOptions(link)) }
      productsWithOptions.push(product)
    }
    products = productsWithOptions
  }

  return products
}

const scrapeAll = async () => {
  let categories = {}

  const sports = Object.keys(AllCategories)
  const allCategories = await Promise.all(
    sports.map(async (sport) => {
      let products = {}
      const sportCategories = AllCategories[sport]
      const all = await Promise.all(
        sportCategories.map((category) => scrape(sport, category)),
      )
      console.log(all.length)
      products = sportCategories.reduce((result, current, i) => {
        result[current] = all[i]
        return result
      }, products)
      return Promise.resolve(products)
    }),
  )

  console.log(allCategories.length)
  categories = sports.reduce((result, current, i) => {
    result[current] = allCategories[i]
    return result
  }, categories)

  return {
    name: 'dunlop',
    logo: 'https://dunlopsports.com/wp-content/themes/dunlopsports/assets/img/100yrs-logo.png',
    categories,
  }
}

export default scrapeAll
