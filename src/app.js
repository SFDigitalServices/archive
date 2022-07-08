const express = require('express')
const { createSiteRouter, loadSites } = require('./sites')

/**
 *
 * @param {{ cwd?: string }} options
 * @returns {Promise<express.Application>}
 */
module.exports = async function createApp (options) {
  const {
    cwd = '.'
  } = options || {}

  const app = express()
    .disable('x-powered-by')

  const sites = await loadSites('sites/**/*.yml', { cwd })
  for (const site of sites) {
    const router = await createSiteRouter(site)
    app.use(router)
  }

  return app
}
