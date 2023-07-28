import Stripe from 'stripe'
import 'dotenv/config'
import { log } from 'node:console'
import { inspect } from 'node:util'

const limit = 100

const mergeProductPrices = (products, prices) => {
  const url = 'https://westwarwicks.club/squash/#roa'
  const newProducts = []
  for (const product of products) {
    const { name, description, images } = product
    const newProduct = { name, description, images, url, prices: [] }

    // log('product', product.name, product.id)
    for (const price of prices) {
      if (price.product === product.id) {
        // log('price', price.id, 'is in', price.product)
        const { currency, nickname, unit_amount, billing_scheme } = price
        const newPrice = { currency, nickname, unit_amount, billing_scheme }
        newProduct.prices.push(newPrice)
      }
    }
    newProducts.push(newProduct)
  }
  // log(inspect(newProducts, { colors: true, depth: null }))
  return newProducts
}

const createNewProducts = async (newProducts) => {
  const stripe = new Stripe(process.env.ROA_STRIPE_SECRET_KEY)

  try {
    for (const product of newProducts) {
      const { name, description, images, url } = product
      const newProduct = await stripe.products.create({
        name,
        description,
        images,
        url,
      })
      log('created new product', name, newProduct.id)
      const { prices } = product
      for (const price of prices) {
        const { currency, nickname, unit_amount, billing_scheme } = price
        const newPrice = await stripe.prices.create({
          currency,
          nickname,
          unit_amount,
          billing_scheme,
          product: newProduct.id,
        })
        log('created new price', newPrice.id, 'of', name, newProduct.id)
      }
    }
  } catch (error) {
    console.error('createNewProducts failed', error)
  }
}

const getTestProducts = async () => {
  const stripe = new Stripe(process.env.ROA_STRIPE_TEST_SECRET_KEY)
  let allProducts = await stripe.products.list({ limit })
  let allPrices = await stripe.prices.list({ limit })
  allProducts = allProducts.data.filter((product) => product.active)
  allPrices = allPrices.data.filter((price) => price.active)
  const newProducts = mergeProductPrices(allProducts, allPrices)
  await createNewProducts(newProducts)
}

await getTestProducts()
