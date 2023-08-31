import pdhsports from '../public/pdhsports.json' assert { type: 'json' }
import dunlop from '../public/dunlop.json' assert { type: 'json' }
import leven from 'leven'
import { writeFileSync } from 'fs'

const find = (product) => {
  // given a product find a price in pdhsports
  const { title } = product
  const products = pdhsports.products
  const matches = []
  products.forEach((product) => {
    const a = title.toLowerCase().trim()
    const b = product.title.toLowerCase().trim()
    const diff = leven(a, b)
    matches.push({ diff, a, b, product })
    // console.log(`comparing ${title} with ${product.title} = ${diff}`)
    return title === product.title
  })

  matches.sort((a, b) => {
    return a.diff - b.diff
  })

  return matches.slice(0, 3)
}

const run = () => {
  const findings = []
  const categories = dunlop.categories
  for (const sport in categories) {
    for (const section in categories[sport]) {
      for (const product of categories[sport][section]) {
        findings.push(find(product))
      }
    }
  }
  writeFileSync('./public/pricing.json', JSON.stringify(findings))
}

run()
