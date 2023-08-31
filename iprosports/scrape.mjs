import * as cheerio from 'cheerio'
import scrapeOptions from './scrape-options.mjs'

const company = 'iprosports'
const sport = 'gym'
const category = 'apparel'
const scrape = async () => {
  const URL =
    'https://www.iprosports.co.uk/club-zone/west-warwicks-sports-club/'

  const file = await fetch(URL)
  const doc = await file.text()

  const $ = cheerio.load(doc)
  const products = []
  $('.product-wrapper').each(function () {
    const image_link = $(this).find('.image-link')
    const primary_image = $(this).find('.primary_image')
    const secondary_image = $(this).find('.secondary_image')
    const price_box = $(this).find('.price-box bdi')
    const product_desc = $(this).find('.product-desc p')

    const title = image_link
      .attr('title')
      .replace('West Warwicks ', '')
      .replace('Skort', 'Skirt')
    const link = image_link.attr('href')
    const main = primary_image.attr('src')
    const over = secondary_image.attr('src')
    const price = price_box.text()
    const description = product_desc.text()
    const product = {
      company,
      sport,
      category,
      title,
      description,
      link,
      main,
      over,
      price,
    }
    products.push(product)
  })
  // console.log(products)
  // build the options from the links

  for (let product of products) {
    const { link } = product
    const { sizes, colors } = await scrapeOptions(link)
    product.sizes = sizes
    product.colors = colors
  }

  return {
    name: 'iprosports',
    logo: 'https://www.iprosports.co.uk/wp-content/uploads/2020/12/iProSports-logo.svg',
    products,
  }
}

export default scrape
