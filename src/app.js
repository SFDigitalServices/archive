const express = require('express')
const { default: httpFilter } = require('http-method-filter')

/**
 * @typedef {import('..').AppOptions} AppOptions
 */

/**
 *
 * @param {AppOptions} options
 * @returns {Promise<express.Application>}
 */
module.exports = async function createApp (options) {
  const {
    sites = [],
    allowedMethods = ['GET', 'HEAD', 'OPTIONS']
  } = options || {}

  const app = express()
    // disable the X-Powered-By: Express header
    .disable('x-powered-by')
    // only trust one level of proxy forwarding
    // see: <https://expressjs.com/en/guide/behind-proxies.html>
    .set('trust proxy', 1)

  app.use(
    httpFilter(allowedMethods),
    logHandler
  )

  for (const site of sites) {
    console.info('+ site %s: %s %s', site.name, site.baseUrl, site.hostnames?.join(', '))
    const router = site.createRouter()
    app.use(router)
  }

  return app

  function logHandler (req, res, next) {
    if (process.env.NODE_ENV !== 'test') {
      console.info(`${req.method} ${req.hostname} ${req.originalUrl}`)
    }
    next()
  }
}
