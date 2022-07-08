#!/usr/bin/env node
const { URL } = require('node:url')
const [url = ''] = process.argv.slice(2)
if (url?.includes('.herokuapp.com')) {
  try {
    const parts = new URL(url).hostname.split('.')
    console.log(parts[0])
  } catch (error) {
    console.warn('failed to parse URL: %s', JSON.stringify(url))
  }
} else {
  console.warn('you must pass a herokuapp.com URL (got %s)', JSON.stringify(url))
}
