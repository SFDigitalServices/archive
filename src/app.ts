import express, { Application, Request, Response } from 'express'
import { archiveRedirectHandler, getRequestUrl } from './archive'
import { getActualRequestUrl } from './url'
import { loadMatcher, explicitRedirectHandler } from './redirect'

const redirectMatcher = loadMatcher('rules/index.yml')
const redirectHandler = explicitRedirectHandler(redirectMatcher)

const app: Application = express()
  .use(express.static('public'))
  .use(function requestUrlHandler (req: Request, res: Response, next: CallableFunction): void {
    if (!res.locals.url) {
      res.locals.url = getRequestUrl(req)
    }
    next()
  })
  .use(redirectHandler)
  .use(archiveRedirectHandler)
  .use((error: unknown, req: Request, res: Response, next: CallableFunction) => {
    if (res.headersSent) {
      next(error)
    } else {
      res
        .status(404)
        .render('error', {
          error: `404 not found: "${getActualRequestUrl(req)}`
        })
    }
  })

export default app
