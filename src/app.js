const express = require('express')
const { default: httpMethodFilter } = require('http-method-filter')
const { createAPIRouter } = require('./api')
const { removePrefix } = require('./utils')

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
    allowedMethods = ['GET', 'HEAD', 'OPTIONS']
  } = options || {}

  const app = express()
    // disable the X-Powered-By: Express header
    .disable('x-powered-by')
    // only trust one level of proxy forwarding
    // see: <https://expressjs.com/en/guide/behind-proxies.html>
    .set('trust proxy', 1)

  if (allowedMethods?.length) {
    app.use(httpMethodFilter(allowedMethods))
  }

  const siteRouter = new express.Router({
    caseSensitive: true,
    mergeParams: true
  })

  for (const site of sites) {
    try {
      log.info('site %s: %s %s', site.name, site.baseUrl, site.hostnames?.join(', '))
      siteRouter.use(site.createRouter())
    } catch (error) {
      log.error('site configuration error:', site?.config, error)
    }
  }

  app.use('/api/v1', createAPIRouter(options))

  /*
   * app.use() here mounts the site router at a URI pattern matching
   * `/_/:hostname` (where `:hostname` matches anything except `/`), preceded by
   * a tiny middleware that sets res.locals.hostname to the `:hostname` portion.
   *
   * From then on out, req.path is everything after the `:hostname` portion of
   * the request path, and the site router knows no difference.
   */
  app.use('/_/:hostname([^/]+)', hostnamePathMiddleware('/_'), siteRouter)

  app.use(siteRouter)

  return app
}

/**
 * @param {string} pathPrefix
 * @returns {express.RequestHandler}
 */
function hostnamePathMiddleware (pathPrefix) {
  return (req, res, next) => {
    const { hostname } = req.params
    res.locals.hostname = hostname
    const prefix = `${pathPrefix}/${hostname}`
    res.locals.path = removePrefix(req.path, prefix)
    res.locals.originalUrl = removePrefix(req.originalUrl, prefix)
    next()
  }
}
