import * as cheerio from 'cheerio'
import { writeFileSync } from 'fs'

const company = 'pdhsports'

const scrape = async () => {
  const URL = 'https://www.pdhsports.com/c/q/brand/dunlop'

  const file = await fetch(URL)
  const doc = await file.text()

  const $ = cheerio.load(doc)
  const products = []
  $('[data-manufacturer="dunlop"]').each(function () {
    const $link = $(this).find('a')
    const title = $link.attr('title').replace('Dunlop ', '')
    const data = $(this).data()

    const product = {
      company,
      title,
      ...data,
    }
    products.push(product)
  })

  return {
    name: company,
    logo: 'https://www.pdhsports.com/themes/pdhsports/css/i/mobile-spritex2.png',
    products,
  }
}

export default scrape

async function run() {
  const pricelist = await scrape()
  writeFileSync('./public/pdhsports.json', JSON.stringify(pricelist))
}

run()
