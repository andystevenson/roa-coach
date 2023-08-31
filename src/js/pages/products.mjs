import { apiFetch } from './utilities.mjs'
import * as cheerio from 'cheerio'
import './nav.mjs'
import kebabCase from 'lodash.kebabcase'

const scrape = async () => {
  const url = '/api/scrape'
  const data = await apiFetch(url)
  // console.log(data)
  return data
}

const main = document.body.querySelector('main')

function checkoutDialog() {
  const $ = cheerio.load(
    `<dialog id="checkout"><form id="checkout-form"></form></dialog>`,
    null,
    false,
  )
  const $dialog = $('dialog')
  const $form = $('form')
  $form.before('<header><h2>Checkout</h2></header>')
  $form.append('<ul id="checkout-items"></ul>')
  $dialog.append(
    '<p class="checkout-total-section"><span>Total</span><span id="checkout-total"></span></p>',
  )
  $dialog.append(
    '<footer><button type="button" id="checkout-cancel">cancel</button><button type="submit" id="checkout-submit">checkout</button></footer>',
  )

  const html = $.html()
  console.log({ html })
  return html
}

function selectProduct(e) {
  // console.log('selected', e.target, e.target.tagName)
  if (e.target.tagName === 'SUMMARY') return
  const product = e.target.closest('.product')
  const selectedCount = document.getElementById('selected-count')
  let count = parseInt(
    selectedCount.textContent ? selectedCount.textContent : '0',
  )
  // console.log('actually selected', product)
  if (product.dataset.selected === 'true') {
    // toggle it off
    delete product.dataset.selected
    count--
    selectedCount.textContent = count > 0 ? count : ''
    return
  }

  count++
  selectedCount.textContent = count > 9 ? '9+' : count

  product.dataset.selected = true
}

function productSelectedHandlers() {
  const products = Array.from(document.querySelectorAll('.product'))
  for (const product of products) {
    product.addEventListener('click', selectProduct)
  }
}

async function run() {
  console.log('running')
  const vendors = await scrape()
  const $ = cheerio.load('<section class="vendors"></section>', null, false)

  const $checkout = checkoutDialog()
  const $vendors = $('.vendors')
  $vendors.before($checkout)
  $vendors.append(
    `<button type="button" id="activate-checkout"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cart4" viewBox="0 0 16 16"><path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .485.379L2.89 4H14.5a.5.5 0 0 1 .485.621l-1.5 6A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.485-.379L1.61 3H.5a.5.5 0 0 1-.5-.5zM3.14 5l.5 2H5V5H3.14zM6 5v2h2V5H6zm3 0v2h2V5H9zm3 0v2h1.36l.5-2H12zm1.11 3H12v2h.61l.5-2zM11 8H9v2h2V8zM8 8H6v2h2V8zM5 8H3.89l.5 2H5V8zm0 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm9-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0z"/></svg><span id="selected-count"></span></button>`,
  )
  vendors.forEach((vendor) => {
    const { name, logo, products, categories } = vendor
    $('section.vendors').append(`<section id=${name} class="vendor"></section>`)
    let $vendor = $(`[id="${name}"]`)
    $vendor.append(
      `<header><img src="${logo}" alt="${name}" class="vendor-logo"></header>`,
    )
    if (products) {
      const html = createProducts(products)
      $vendor.append(html)
    }
    if (categories) {
      const html = createCategories(name, categories)
      $vendor.append(html)
    }
  })

  main.innerHTML = $.html()
  const showCheckout = document.getElementById('activate-checkout')
  showCheckout?.addEventListener('click', checkoutSession)
  productSelectedHandlers()
  checkForDuplicateIds()
}

function checkForDuplicateIds() {
  const ids = Array.from(document.querySelectorAll('[id]'))
    .map((v) => v.id)
    .reduce((acc, v) => {
      acc[v] = (acc[v] || 0) + 1
      return acc
    }, {})
  const named = Object.entries(ids).filter(([id, count]) => count > 1)

  console.warn('duplicates', { ids }, { named })
}

function unselectProduct(e) {
  console.log('unselect', e.target)
  const checkbox = e.target
  const li = checkbox.parentElement
  const priceElement = li.querySelector('.checkout-price')
  const qty = li.querySelector('.checkout-qty')
  const unitPrice = checkbox.dataset.unitPrice
  const selected = document.getElementById(checkbox.dataset.id)
  selected.click()
  if (checkbox.checked) {
    priceElement.textContent = unitPrice
    qty.value = 1
    updateCheckoutTotal()
    return
  }
  priceElement.textContent = '£0.00'
  qty.value = 0
  updateCheckoutTotal()
}

function updateQty(e) {
  const qty = e.target
  const price = qty.nextElementSibling
  const unitPrice = +qty.dataset.unitPrice.slice(1)
  const quantity = +qty.value
  const total = quantity * unitPrice
  console.log({ qty, price, unitPrice, quantity, total })
  price.textContent = `£${total.toFixed(2)}`
  updateCheckoutTotal()
}

function updateCheckoutTotal() {
  const qtys = Array.from(checkout.querySelectorAll('.checkout-qty'))

  const checkoutTotal = document.getElementById('checkout-total')
  const total = qtys.reduce((total, qty) => {
    const { unitPrice } = qty.dataset
    const price = +unitPrice.slice(1)
    const quantity = +qty.value
    total += quantity * price
    return total
  }, 0)
  checkoutTotal.textContent = `£${total.toFixed(2)}`
}

function handleSubmit(e) {
  e.preventDefault()
  const button = e.target
  const checkout = document.getElementById('checkout')
  const form = document.getElementById('checkout-form')
  const data = new FormData(form)
  const request = Object.fromEntries(data.entries())
  console.log('handleSubmit', { button, form, request })
  clearSelected()
  checkout.close()
}

const selectColor = (select, color) => {
  select.value = color
  select.dispatchEvent(new Event('change'))
}

const deselectColorImages = (ul) => {
  if (!ul) return
  const lis = Array.from(ul.children)
  lis.forEach((li) => delete li.dataset.selectedcolor)
}

const selectColorImages = (ul, color) => {
  if (!ul) return
  const checkoutDetails = ul.closest('.checkout-details')
  const checkoutPricing =
    checkoutDetails.parentElement.querySelector('.checkout-pricing')
  console.log({ checkoutPricing })
  const lis = Array.from(ul.children)
  lis.forEach((li) => {
    const imgColor = li.firstElementChild.dataset.color

    if (imgColor === color) {
      li.dataset.selectedcolor = true
      const options = { inline: 'end', behaviour: 'smooth' }
      li.scrollIntoView(options)
    }
  })
  checkoutPricing?.scrollIntoView()
}

const handleSelectColorImage = (e) => {
  const img = e.target
  const ul = img.closest('ul')
  const checkoutDetails = ul.closest('.checkout-details')
  const productColors = checkoutDetails.querySelector('.product-colors')
  const color = img.dataset.color
  selectColor(productColors, color)
  console.log('handleSelectColorImage', {
    img,
    color,
    ul,
    checkoutDetails,
    productColors,
  })
}

const handleColorChange = (e) => {
  const select = e.target
  const checkoutDetails = select.closest('.checkout-details')
  const ul = checkoutDetails.querySelector('.product-colors-images')
  deselectColorImages(ul)
  const index = select.selectedIndex
  const color = select.options[index].value
  console.log('handleColorChange', { select, ul, index, color })
  selectColorImages(ul, color)
}

function addCheckoutHandler() {
  const checkout = document.getElementById('checkout')
  const checkboxes = Array.from(checkout.querySelectorAll('.checkout-checkbox'))
  const cancel = document.getElementById('checkout-cancel')
  cancel.addEventListener('click', () => checkout.close())

  const submit = document.getElementById('checkout-submit')
  submit.addEventListener('click', handleSubmit)

  checkboxes.forEach((checkbox) =>
    checkbox.addEventListener('change', unselectProduct),
  )
  const qtys = Array.from(checkout.querySelectorAll('.checkout-qty'))
  qtys.forEach((qty) => qty.addEventListener('change', updateQty))
  updateCheckoutTotal()

  // handle color images
  const colorImages = Array.from(
    checkout.querySelectorAll('.product-colors-image-img'),
  )

  colorImages.forEach((img) =>
    img.addEventListener('click', handleSelectColorImage),
  )

  const productColors = Array.from(checkout.querySelectorAll('.product-colors'))
  productColors.forEach((select) => {
    select.addEventListener('change', handleColorChange)
    select.dispatchEvent(new Event('change'))
  })
}

function clearSelected() {
  const selectedProducts = Array.from(
    document.querySelectorAll('[data-selected]'),
  )
  selectedProducts.forEach((product) => product.click())
}

const checkoutItemDetails = (product) => {
  const elements = {
    description: product.querySelector('.product-description'),
    sizes: product.querySelector('.product-sizes'),
    colors: product.querySelector('.product-colors'),
    pack: product.querySelector('.product-pack'),
    colorsImages: product.querySelector('.product-colors-images'),
  }

  const clones = {
    description: elements.description ? elements.description.outerHTML : null,
    pack: elements.pack
      ? elements.pack.outerHTML
      : elements.sizes
      ? '<span>single</span>'
      : null,
    sizesLabel: elements.sizes ? '<span>sizes</span>' : null,
    sizes: elements.sizes ? elements.sizes.outerHTML : null,
    colorsLabel: elements.colors ? '<span>colors</span>' : null,
    colors: elements.colors ? elements.colors.outerHTML : null,
    colorsImages: elements.colorsImages
      ? elements.colorsImages.outerHTML
      : null,
  }

  let details = ''
  for (const detail in clones) {
    if (detail) details = clones[detail] ? details + clones[detail] : details
  }
  console.log({ clones })

  const section = `<section class="checkout-details">${details}</section>`
  return section
}

function checkoutSession() {
  const checkout = document.getElementById('checkout')
  checkout?.showModal()
  const selectedProducts = Array.from(
    document.querySelectorAll('[data-selected]'),
  )
  const checkoutItems = document.getElementById('checkout-items')

  const checkoutList = selectedProducts
    .map((product) => {
      const id = product.id
      const { title, price, image } = product.dataset
      // gather the optional elements for the details section
      let details = checkoutItemDetails(product)

      const template = `<li data-id="${id}">
        <section class="checkout-pricing">
          <input type="checkbox" class="checkout-checkbox" checked data-unit-price="${price}" data-id="${id}">
          <img src="${image}" alt="checkout image" class="checkout-image">
          <span class="checkout-title">${title}</span>
          <input type="number" name="${id}-qty" min="0" max="99" value="1" class="checkout-qty" data-unit-price="${price}">
          <span class="checkout-price">${price}</span>
        </section>${details}</li>`
      return template
    })
    .join('')
  checkoutItems.innerHTML = checkoutList
  addCheckoutHandler()
}

function createCategories(vendor, categories) {
  console.log({ vendor, categories })
  const $ = cheerio.load(
    `<section class="vendor-categories" open></section>`,
    null,
    false,
  )
  const $categories = $('.vendor-categories')
  for (const category in categories) {
    const id = `${vendor}-${category}`
    $categories.append(
      `<details id="${id}" class="vendor-category" open><summary>${category}</summary></details>`,
    )

    const $category = $(`[id="${id}"]`)
    const productSections = categories[category]
    let nth = 0
    for (const section in productSections) {
      const id = `${vendor}-${category}-${section}`
      const open = nth === 0 ? 'open' : ''
      $category.append(
        `<details id="${id}" class="vendor-category-section" ${open}><summary>${section}</summary></details>`,
      )

      const products = productSections[section]
      const $categorySection = $(`[id="${id}"]`)
      const html = createProducts(products)
      $categorySection.append(html)
      nth++
    }
  }
  return $.html()
}

function createSizes(sizes, id) {
  if (!sizes) return ''
  const options = sizes
    .map(
      (size, i) =>
        `<option value="${size}" class="product-sizes-option" 
          ${i === 0 ? 'selected' : ''}>${size}</option>`,
    )
    .join('')
  return `<select id="${id}-sizes" class="product-sizes" name="${id}-sizes">${options}</select>`
}

function createColorImages(colors, id) {
  if (!colors) return ''
  if (colors.length < 1) return ''
  if (typeof colors[0] === 'string') return ''

  const images = colors
    .map((choice) => {
      const { color, image } = choice
      if (typeof image === 'string') {
        return image.startsWith(`#`)
          ? `<li><div data-color="${color}" class="product-colors-image-rgb" style="background-color:${image};"></div></li>`
          : `<li><img data-color="${color}" class="product-colors-image-img" src="${image}" alt="color image for ${color}" loading="lazy"></li>`
      }
      // TODO: alternate images for same color
    })
    .join('')
  const ul = `<ul id="${id}-colors-images" class="product-colors-images">${images}</ul>`
  return ul
}

const uniqueColors = (colors) => {
  const gather = colors.map((color) => {
    if (typeof color === 'string') return color
    return color.color
    // must be object {color: "", image: ""}
  })

  return [...new Set(gather)]
}

function createColors(colors, id) {
  if (!colors) return ''

  const unique = uniqueColors(colors)
  // console.log({ colors, unique })
  const options = unique
    .map((choice, i) => {
      if (typeof choice === 'string') {
        // case of simple list
        return `<option value="${choice}" class="product-colors-option" 
            ${i === 0 ? 'selected' : ''}>${choice}</option>`
      }

      // we have an object {color: "", image: ""}
      const { color } = choice
      const option = `<option value="${color}" class="product-colors-option-image" 
                        ${i === 0 ? 'selected' : ''}>${color}</option>`
      return option
    })
    .join('')
  const select = `<select id="${id}-colors" class="product-colors" name="${id}-colors">${options}</select>`
  const images = createColorImages(colors, id)
  return select + images
}

function createFabric(fabric, id) {
  if (!fabric) return ''
  return `<p id="${id}-fabric" class="product-fabric">${fabric}</p>`
}

function createPack(pack, id) {
  if (!pack) return ''
  if (pack === 'one') return
  return `<span id="${id}-pack" class="product-pack">${pack}</span>`
}

function createProducts(products) {
  const $ = cheerio.load(`<section class="media-scroller"></section>`)
  products.forEach((product) => {
    const {
      company,
      sport,
      category,
      description,
      desc,
      subtitle,
      link,
      main,
      over,
      price,
      title,
      colors,
      sizes,
      fabric,
      pack,
    } = product
    let unique = link.split('/')
    unique = link.endsWith('/')
      ? unique[unique.length - 2]
      : unique[unique.length - 1]

    let fDescription = description
    if (desc) {
      // concatenate detailed description if it exists
      fDescription = description.includes(desc)
        ? description
        : `${description} ${desc}`
    }

    const id = `${company}-${sport}-${category}-${kebabCase(unique)}`
    const $new = cheerio.load(
      `<article id="${id}" class="product" data-title="${title}" data-price="${price}" data-image="${main}"></article>`,
    )
    const $article = $new('article.product')
    if (over) {
      // not all products will have an alternate picture
      $article.append(
        `<img class="product-over-image" src="${over}" 
            alt="alternate image for ${title}" loading="lazy">`,
      )
    }
    $article.append(
      `<img class="product-main-image" src="${main}" alt="${title} image" loading="lazy">`,
    )
    $article.append(`<h3 class="product-title">${title}</h3>`)

    $article.append(`<a href="${link}" class="product-vendor-link"></a>`)
    $article.append(`<span class="product-price">${price}</span>`)
    $article.append(
      `<details id="${id}-description" class="product-description"><summary>description</summary>
        <p class="product-subtitle">${subtitle ?? ''}</p>
        <p>${fDescription}</p>
      </details>`,
    )
    const fFabric = createFabric(fabric, id)
    if (fFabric) $article.append(fFabric)

    const fPack = createPack(pack, id)
    if (fPack) $article.append(fPack)

    const fSizes = createSizes(sizes, id)
    if (fSizes) $article.append(fSizes)

    const fColors = createColors(colors, id)
    if (fColors) $article.append(fColors)

    $('.media-scroller').append($new.html())
  })
  return $.html()
}

run()
