const express = require('express')
const globby = require('globby')
const { loadConfig, createSiteRouter } = require('./src')

const { NODE_ENV } = process.env
if (NODE_ENV !== 'production') {
  require('dotenv').config()
}

const { PORT } = process.env

if (!PORT) throw new Error('$PORT is unset')

const app = express()

globby('sites/**/*.yml')
  .then(yamls => Promise.all(
    yamls.map(loadConfig)
  ))
  .then(async configs => {
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
