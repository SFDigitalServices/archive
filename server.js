const express = require('express')
const { createSiteRouter, loadAllSites } = require('./src/sites')

const { NODE_ENV } = process.env
if (NODE_ENV !== 'production') {
  require('dotenv').config()
}

const { PORT } = process.env

if (!PORT) throw new Error('$PORT is unset')

const app = express()

// eslint-disable-next-line promise/catch-or-return
loadAllSites('sites')
  .then(async configs => {
    // eslint-disable-next-line promise/always-return
    for (const config of configs) {
      const router = await createSiteRouter(config)
      app.use(router)
    }
  })
  .then(() => {
    const server = app.listen(PORT, () => {
      const { address, port } = server.address()
      const host = address === '::' ? 'localhost' : address
      console.log('listening on %s:%d', host, port)
    })
    return server
  })
