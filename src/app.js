const express = require('express')
const morgan = require('morgan')

/**
 * @typedef {import('..').AppOptions} AppOptions
 */

/**
 *
 * @param {AppOptions} options
 * @returns {Promise<express.Application>}
 */
module.exports = async function createApp (options) {
  const log = require('./log').scope('app')

  const {
    sites = []
  } = options || {}

  const app = express()
    // disable the X-Powered-By: Express header
    .disable('x-powered-by')
    // only trust one level of proxy forwarding
    // see: <https://expressjs.com/en/guide/behind-proxies.html>
    .set('trust proxy', 1)
    .use(morgan('combined'))

  for (const site of sites) {
    try {
      log.info('site %s: %s %s', site.name, site.baseUrl, site.hostnames?.join(', '))
      app.use(site.createRouter())
    } catch (error) {
      log.error('site configuration error:', site?.config, error)
    }
  }

  return app
}
