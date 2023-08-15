import { Page, Pathname } from './page-info.mjs'

const nav = document.getElementById('nav')

const activeLink = nav?.querySelector(`[href^="${Pathname}"]`)

activeLink?.classList.add('active-page')

console.log('nav', { Page, Pathname, nav, activeLink })
