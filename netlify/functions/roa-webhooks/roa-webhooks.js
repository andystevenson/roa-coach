const x = require('stripe')
const env = require('../../../src/js//stripeEnv.js')
const { stripe, webhook } = env

const https = require('https')
// const axios = require('axios').default.create({
//   httpsAgent: new https.Agent({ keepAlive: true }),
// })

const axios = require('axios')
const emailService = `${process.env.URL}/.netlify/functions/email`

const token = require('../../../src/js/authorization-token')
async function sendMail(subject, html) {
  console.log('sendMail')
  try {
    await axios({
      url: emailService,
      method: 'POST',
      data: { subject, html },
      headers: { authorization: token },
    })
    console.log('sendMail done')
  } catch (error) {
    console.log('sendMail error', { error })
  }
}

// chargeSucceededHtml (data)
function chargeSucceededHtml(data) {
  const amount = data.amount / 100
  const html = `
  <h1>Stripe Charge Succeeded</h1>
  <p>${data.billing_details.name}</p>
  <p>${data.billing_details.email}</p>
  <p>${data.billing_details.address.line1}</p>
  <p>${data.billing_details.address.line2}</p>
  <p>${data.billing_details.address.city}</p>
  <p>${data.billing_details.address.postal_code}</p>
  <h2>Receipt</h2>
  <p>Amount <strong>£${amount.toFixed(2)}</strong> by ${
    data.payment_method_details.type
  }</p>
  <p>${data.receipt_url}</p>
  `
  return html
}

// customer.subscription.succeeded
async function subscriptionSucceededHtml(data) {
  const amount = data.plan.amount / 100
  const product = data.plan.nickname
    .replace(/-.*/, '')
    .replace(/^\w/, (c) => c.toUpperCase())
  const interval = data.plan.interval === 'month' ? 'Monthly' : 'Yearly'

  let html = `
  <h1>Subscription Succeeded</h1>
  <p><strong>${product} ${interval}</strong></p>
  <p>Amount <strong>£${amount.toFixed(2)}</strong></p>
  `
  try {
    const customer = await stripe.customers.retrieve(data.customer)
    html += `
    <p>${customer.name}</p>
    <p>${customer.email}</p>
    <p>${customer.address.line1}</p>
    <p>${customer.address.line2}</p>
    <p>${customer.address.city}</p>
    <p>${customer.address.postal_code}</p>
    <p>${customer.phone}</p>
    `
  } catch (error) {
    html += `<h3>ERROR</h3>
    <p><strong>${error.message}</strong></p>
    `
  }

  return html
}

// webhook handler
const success = { statusCode: 200 }

const handler = async (event) => {
  try {
    const { body, headers } = event

    const stripeEvent = stripe.webhooks.constructEvent(
      body,
      headers['stripe-signature'],
      webhook,
    )

    const { type } = stripeEvent
    const { object } = stripeEvent.data

    if (type === 'charge.succeeded') {
      console.log(' >>>>> charge.succeeded <<<<')
      await sendMail('charge.succeeded', chargeSucceededHtml(object))
      return success
    }

    // if (type === 'customer.updated') {
    //   console.log(' >>>>> customer.updated <<<<')
    //   return success
    // }

    if (type === 'customer.subscription.created') {
      console.log(' >>>>> customer.subscription.created <<<<')
      await sendMail(
        'customer.subscription.created',
        await subscriptionSucceededHtml(object),
      )
      return success
    }

    // if (type === 'customer.subscription.updated') {
    //   console.log(' >>>>> customer.subscription.updated <<<<')
    //   return success
    // }

    // if (type === 'customer.subscription.deleted') {
    //   console.log(' >>>>> customer.subscription.deleted <<<<')
    //   return success
    // }

    // if (type === 'customer.subscription.trial_will_end') {
    //   console.log(' >>>>> customer.subscription.trial_will_end <<<<')
    //   return success
    // }

    // if (type === 'invoice.created') {
    //   console.log(' >>>>> invoice.created <<<<')
    //   return success
    // }
    // if (type === 'invoice.deleted') {
    //   console.log(' >>>>> invoice.deleted <<<<')
    //   return success
    // }

    // if (type === 'invoice.finalized') {
    //   console.log(' >>>>> invoice.finalized <<<<')
    //   return success
    // }
    // if (type === 'invoice.finalization_failed') {
    //   console.log(' >>>>> invoice.finalization_failed <<<<')
    //   return success
    // }
    // if (type === 'invoice.paid') {
    //   console.log(' >>>>> invoice.paid <<<<')
    //   return success
    // }

    // if (type === 'invoice.sent') {
    //   console.log(' >>>>> invoice.sent <<<<')
    //   return success
    // }

    // if (type === 'invoice.payment_action_required') {
    //   console.log(' >>>>> invoice.payment_action_required <<<<')
    //   return success
    // }
    // if (type === 'invoice.payment_failed') {
    //   console.log(' >>>>> invoice.payment_failed <<<<')
    //   return success
    // }

    // if (type === 'invoice.payment_succeeded') {
    //   console.log(' >>>>> invoice.payment_succeeded <<<<')
    //   return success
    // }
    // if (type === 'invoice.upcoming') {
    //   console.log(' >>>>> invoice.upcoming <<<<')
    //   return success
    // }
    // if (type === 'invoice.updated') {
    //   console.log(' >>>>> invoice.updated <<<<')
    //   return success
    // }
    // if (type === 'invoice.voided') {
    //   console.log(' >>>>> invoice.voided <<<<')
    //   return success
    // }

    // if (type === 'payment_intent.created') {
    //   console.log(' >>>>> payment_intent.created <<<<')
    //   return success
    // }
    // if (type === 'payment_intent.cancelled') {
    //   console.log(' >>>>> payment_intent.cancelled <<<<')
    //   return success
    // }
    // if (type === 'payment_intent.paymemnt_failed') {
    //   console.log(' >>>>> payment_intent.paymemnt_failed <<<<')
    //   return success
    // }
    // if (type === 'payment_intent.succeeded') {
    //   console.log(' >>>>> payment_intent.succeeded <<<<')
    //   return success
    // }

    return success
  } catch (error) {
    console.log(error.message)
    return { statusCode: 500, body: error.message }
  }
}

module.exports = { handler }
