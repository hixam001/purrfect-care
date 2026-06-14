#!/usr/bin/env node
/**
 * post-build-web.js
 * Patches the Expo-generated index.html to force light-mode regardless of OS
 * colour scheme. Run after `expo export --platform web`.
 */

const fs   = require('fs')
const path = require('path')

const HTML_PATH = path.join(__dirname, '../../frontend/dist/app/index.html')

const LIGHT_MODE_CSS = `
    <!-- Purrfect Care: force light theme — injected by post-build-web.js -->
    <meta name="color-scheme" content="light only" />
    <meta name="theme-color" content="#F5EBE6" />
    <style id="pc-light-lock">
      /* Lock colour scheme BEFORE any JS or RNW styles run */
      :root, html {
        color-scheme: light only !important;
        background-color: #F5EBE6 !important;
        color: #2D1B0E !important;
      }
      body {
        background-color: #F5EBE6 !important;
        color: #2D1B0E !important;
      }
      /* React Native Web mounts inside #root — lock it too */
      #root, #root > div {
        background-color: #F5EBE6 !important;
      }
      /* Override every dark-mode rule the browser or RNW tries to apply */
      @media (prefers-color-scheme: dark) {
        :root, html, body, #root, #root > div {
          color-scheme: light only !important;
          background-color: #F5EBE6 !important;
          color: #2D1B0E !important;
        }
      }
    </style>`

if (!fs.existsSync(HTML_PATH)) {
  console.error(`❌  Could not find: ${HTML_PATH}`)
  process.exit(1)
}

let html = fs.readFileSync(HTML_PATH, 'utf8')

// Inject immediately after <head> so it runs before any other styles
if (html.includes('id="pc-light-lock"')) {
  console.log('⚡  Light-mode patch already present — skipping.')
  process.exit(0)
}

html = html.replace('<head>', `<head>\n${LIGHT_MODE_CSS}`)

// Also add style attribute to <html> and <body> tags
html = html.replace('<html lang="en">', '<html lang="en" style="background-color:#F5EBE6;color:#2D1B0E;color-scheme:light;">')
html = html.replace('<body>', '<body style="background-color:#F5EBE6;color:#2D1B0E;">')

fs.writeFileSync(HTML_PATH, html, 'utf8')
console.log('✅  Light-mode CSS patch applied to dist/app/index.html')
