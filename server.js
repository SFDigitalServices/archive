const createApp = require('./src/app')
const { Site } = require('./src/sites')
const log = require('./src/log').scope('server')

const { NODE_ENV } = process.env
if (NODE_ENV !== 'production') {
  require('dotenv').config()
}

const { PORT } = process.env

if (!PORT) throw new Error('$PORT is unset')

Site.loadAll('config/sites/**/*.yml', { cwd: __dirname })
  .then(sites => createApp({ sites }))
  .then(app => {
    const server = app.listen(PORT, () => {
      const { address, port } = server.address()
      const host = address === '::' ? 'localhost' : address
      log.info('listening on http://%s:%d', host, port)
    })
    return server
  })
  .catch(error => {
    console.error(error)
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  })
