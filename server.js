const createApp = require('./src/app')

const { NODE_ENV } = process.env
if (NODE_ENV !== 'production') {
  require('dotenv').config()
}

const { PORT } = process.env

if (!PORT) throw new Error('$PORT is unset')

createApp({})
  .then(app => {
    const server = app.listen(PORT, () => {
      const { address, port } = server.address()
      const host = address === '::' ? 'localhost' : address
      console.log('listening on http://%s:%d', host, port)
    })
    return server
  })
  .catch(error => {
    console.error(error.message)
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  })
