const express = require('express')

/**
 * @typedef {import('..').AppOptions} AppOptions
 */

/**
 *
 * @param {AppOptions} options
 * @returns {Promise<express.Application>}
 */
module.exports = async function createApp (options) {
  const { sites = [] } = options || {}

  const app = express()
    // disable the X-Powered-By: Express header
    .disable('x-powered-by')
    // only trust one level of proxy forwarding
    // see: <https://expressjs.com/en/guide/behind-proxies.html>
    .set('trust proxy', 1)

  app.use((req, res, next) => {
    console.info(`${req.method} ${req.hostname} ${req.originalUrl}`)
    next()
  })
  for (const site of sites) {
    console.info('+ site <%s>: %s', site.baseUrl, site.hostnames?.join(', '))
    const router = site.createRouter()
    app.use(router)
  }

  return app
}
