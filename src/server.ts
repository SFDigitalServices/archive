import { Server } from 'http'
import getPort from 'get-port'
import app from './app'
import { AddressInfo } from 'net'
import dotenv from 'dotenv'

if (process.env.NODE_ENV === 'development') {
  dotenv.config()
}

const { PORT } = process.env
main({ port: PORT })
  .then((server: Server) => {
    const { port, address } = server.address() as AddressInfo
    console.log('listening on: %s:%s', address === '::' ? 'localhost' : address, port)
  })
  .catch((error: Error) => {
    console.error('Failed to start the server:', error)
    process.exit(1)
  })

async function main ({ port }) {
  if (!port) port = await getPort()
  return new Promise((resolve: (arg: Server) => void, reject: (error: unknown) => void) => {
    try {
      const server: Server = app.listen(port, () => resolve(server))
    } catch (error) {
      reject(error)
    }
  })
}