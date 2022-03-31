import express, { Application, Request, Response } from 'express'

const { PORT = 80 } = process.env
const app: Application = express()
  .use((req: Request, res: Response) => {
    res.send(`
      <h1>Hello from Express!</h1>
      <dl>
        <dt>Host</dt>
        <dd><code>${req.hostname}</code></dd>
        <dt>url</dt>
        <dd><code>${req.url}</code></dd>
        <dt>headers</dt>
        <dd><code><pre>${JSON.stringify(req.headers, null, 2)}</pre></code></dd>
      </dl>
    `)
  })

const server = app.listen(PORT, () => {
  const addr = server.address()
  console.log('listening', addr)
})