const express = require('express')
const morgan = require('morgan')
const { getFullUrl } = require('./utils')

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
    sites = [],
    logger
  } = options || {}

  const aliasPrefix = '/_/'

  const app = express()
    // disable the X-Powered-By: Express header
    .disable('x-powered-by')
    // only trust one level of proxy forwarding
    // see: <https://expressjs.com/en/guide/behind-proxies.html>
    .set('trust proxy', 1)
    .use(logger === false ? noopHandler : logger || morgan('combined'))
    .use(aliasPrefix, urlAliasHandler({
      prefix: aliasPrefix,
      log: log.scope('alias')
    }))

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

/**
 * The URL alias handler sets res.locals with information about the URL
 * following the provided path prefix. Routers can then use the locals
 * routers to determine the _intended_ `hostname`, `path`, and originalUrl (path +
 * query string)
 *
 * @param {{ prefix: string, log: import('signales').SignaleEntrypoint }} options
 * @returns {express.RequestHandler}
 */
function urlAliasHandler ({ prefix, log }) {
  return (req, res, next) => {
    const uri = req.path.replace(prefix, '')
    log.info(uri)
    let url
    try {
      url = getFullUrl(uri)
    } catch (error) {
      log.error('url alias parse error:', error)
    }
    if (url) {
      const { hostname, pathname: path } = url
      Object.assign(res.locals, {
        // uri,
        url: String(url),
        hostname,
        path,
        originalUrl: Object.keys(req.query).length
          ? `${path}?${new URLSearchParams(req.query)}`
          : path
      })
      log.info('url:', uri, String(url))
      next()
    } else {
      log.error('unable to parse:', uri)
      res.status(404).send('Not found')
    }
  }
}

/** @type {express.RequestHandler} */
function noopHandler (req, res, next) {
  return next()
}
