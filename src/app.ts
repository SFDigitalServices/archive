import express, { Application, Request, Response } from 'express'
import { archiveRedirectHandler } from './archive'

const app: Application = express()
  .use(archiveRedirectHandler)
  .use((req: Request, res: Response) => {
    res.status(404).send('Not found')
  })

export default app
