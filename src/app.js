const express = require('express')
const { createSiteRouter, loadSites } = require('./sites')

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
    cwd = '.'
  } = options || {}

  const app = express()

  const sites = await loadSites('sites/**/*.yml', { cwd })
  for (const site of sites) {
    const router = await createSiteRouter(site)
    app.use(router)
  }

  return app
}
