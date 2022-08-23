const { Router } = require('express')
const { Site } = require('./sites')
// const log = require('./log').scope('api')

/**
 * @typedef {import('express').RequestHandler} RequestHandler
 */

module.exports = {
  /**
   * @param {import('..').AppOptions?} options
   * @returns {Router}
   */
  createAPIRouter (config) {
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

    router.get('/', /** @type {RequestHandler} */ (req, res) => {
      const path = req.baseUrl
      res.send(`
        <h1>archive API v1</h1>
        <h2>Sites</h2>
        <ul>
          <li><a href="${path}/sites"><code>${path}/sites</code></a> returns all of the known sites as an array</li>
          <li><code>${path}/sites/:domain</code> returns the site with a hostname matching <code>:domain</code>, e.g.
            <ul>
              <li><a href="${path}/sites/innovation.sfgov.org">innovation.sfgov.org</a></li>
              <li><a href="${path}/sites/sftreasureisland.org">sftreasureisland.org</a></li>
            </ul>
          </li>
        </ul>
      `)
    })

    router.get('/sites', /** @type {RequestHandler} */ (req, res) => {
      res.json({
        status: 'success',
        data: {
          sites: staticSitesData
        }
      })
    })

    router.get('/sites/:hostname', /** @type {RequestHandler} */ (req, res) => {
      const { hostname } = req.params
      const site = sitesByHostname.get(hostname)
      if (site) {
        return res.json({
          status: 'success',
          data: site
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
