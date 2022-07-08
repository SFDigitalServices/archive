const express = require('express')
const { createSiteRouter, loadAllSites } = require('./sites')

/**
 *
 * @param {{ port: number }} options
 * @returns {Promise<express.Application>}
 */
module.exports = async function createApp (options) {
  const app = express()

  const sites = await loadAllSites('sites')
  for (const site of sites) {
    const router = await createSiteRouter(site)
    app.use(router)
  }

  return app
}
