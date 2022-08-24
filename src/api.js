const express = require('express')
const { Site } = require('./sites')
// const log = require('./log').scope('api')

/**
 * @typedef {import('express').RequestHandler} RequestHandler
 * @typedef {import('..').SiteJSONData} SiteJSONData
 */

const GITHUB_BASE_URL = 'https://github.com/SFDigitalServices/archive'
const SFDS_BASE_URL = 'https://unpkg.com/sfgov-design-system@2.4.0'
const html = String.raw

module.exports = {
  /**
   * @param {{ sites: Site[] }} options
   * @returns {express.Application}
   */
  createAPIRouter (options) {
    const { sites } = options

    const api = express.Router()

    /** @type {SiteJSONData[]} */
    const staticSitesData = sites
      .filter(site => site instanceof Site)
      .map(site => site.toJSON())

    /** @type {Map<string, SiteJSONData>} */
    const sitesByHostname = new Map()
    for (const site of staticSitesData) {
      for (const host of site.hostnames) {
        if (sitesByHostname.has(host)) {
          const existing = sitesByHostname.get(host)
          throw new Error(`Multiple sites map to the hostname "${host}": ${existing.name} (${existing.baseUrl}) and ${site.name} (${site.baseUrl})`)
        }
        sitesByHostname.set(host, site)
      }
    }

    /** @type {string[]} */
    const availableHostnames = [...sitesByHostname.keys()]
      .filter(host => host !== 'localhost' && !host.startsWith('.'))
      .sort()

    api.get('/', documentationHandler)

    api.get('/hostnames', staticDataHandler(availableHostnames))

    api.get('/sites/:hostname', /** @type {RequestHandler} */ (req, res) => {
      const { hostname } = req.params
      const site = sitesByHostname.get(hostname)
      if (site) {
        return res.json({
          status: 'success',
          data: site
        })
      } else {
        return res.status(404).json({
          status: 'fail',
          code: 404,
          message: `No site found with hostname "${hostname}"`
        })
      }
    })

    api.get('/sites', staticDataHandler(staticSitesData))

    return api

    /**
     * @param {any} data
     * @returns {RequestHandler}
     */
    function staticDataHandler (data, additionalProps = {}) {
      return (req, res) => res.json({
        status: 'success',
        data,
        ...additionalProps
      })
    }
  }
}

/** @type {RequestHandler} */
function documentationHandler (req, res) {
  const path = req.baseUrl
  return res.send(html`
    <!doctype html>
    <html lang="en">
    <head>
      <link rel="stylesheet" href="${SFDS_BASE_URL}/dist/css/sfds.css">
      <link rel="stylesheet" href="${SFDS_BASE_URL}/dist/css/fonts.css">
    </head>
    <body class="responsive-container py-80">
      <h1 class="display-lg m-0">archive API v1</h1>

      <h2 class="title-md my-16" id="sites">Sites</h2>
      <p>
        Each "site" corresponds to a YAML configuration in
        <a href="${GITHUB_BASE_URL}/tree/main/config/sites#readme">the <code>config/sites</code> directory</a>,
        and describes an archived site for which this server will manage redirects. Each site has one or more
        <a href="#hostnames">hostnames</a> to which this server will respond.
      </p>
      <ul>
        <li><a href="${path}/sites"><code>${path}/sites</code></a> returns all of the known sites as an array</li>
        <li><code>${path}/sites/:hostname</code> returns the site with the given <a href="#hostnames">hostname</a></li></li>
      </ul>

      <h2 class="title-md my-16" id="hostnames">Hostnames</h2>
      <p>
        Assuming DNS is properly configured (or with the appropriate <code>Host</code> header over insecure HTTP),
        this server will respond to any of the hostnames listed in its <a href="#sites">site</a> configurations.
      </p>
      <ul>
        <li><a href="${path}/hostnames"><code>${path}/hostnames</code></a> lists all of the available hostnames</li>
      </ul>
    </body>
  `)
}
