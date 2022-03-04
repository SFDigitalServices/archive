import express, { Application } from 'express'
import { archiveRedirectHandler } from './archive'
import errorHandler from './error'

const app: Application = express()
  .use(archiveRedirectHandler, errorHandler)

export default app