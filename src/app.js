const express = require('express')
const { createSiteRouter } = require('./sites')

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
    sites = []
  } = options || {}

  const app = express()

  for (const site of sites) {
    const router = await createSiteRouter(site)
    app.use(router)
  }

  return app
}
