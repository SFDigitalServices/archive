const { Router } = require('express')
const { Site } = require('./sites')

/**
 * @typedef {import('express').RequestHandler} RequestHandler
 */

module.exports = {
  /**
   * @param {import('..').AppOptions?} options
   */
  createApiRouter (config) {
    const { sites = [] } = config || {}

    const router = new Router({
      caseSensitive: true,
      mergeParams: true
    })

    /** @type {import('..').SiteJSONData[]} */
    const staticSitesData = sites
      .filter(site => site instanceof Site)
      .map(site => site.toJSON())

    /** @type {Map<string, import('..').SiteJSONData>} */
    const sitesByHostname = new Map()
    for (const site of staticSitesData) {
      for (const host of site.hostnames) {
        sitesByHostname.set(host, site)
      }
    }

    router.get('/sites', /** @type {RequestHandler} */ (req, res) => {
      res.json({
        status: 'success',
        data: {
          sites: staticSitesData
        }
      })
    })

    router.get('/site/:hostname', /** @type {RequestHandler} */ (req, res) => {
      const { hostname } = req.params
      const site = sitesByHostname.get(hostname)
      if (site) {
        return res.json({
          status: 'success',
          data: site.toJSON()
        })
      } else {
        return res.status(404).json({
          status: 'error',
          data: {
            status: 404,
            message: `No site found with hostname "${hostname}"`
          }
        })
      }
    })

    return router
  }
}
