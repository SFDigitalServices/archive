import express, { Application, Request, Response } from 'express'

const { PORT = 80 } = process.env
const app: Application = express()
  .get('/', (req: Request, res: Response) => {
    res.send('Hello from Express!')
  })

const server = app.listen(PORT, () => {
  const addr = server.address()
  console.log('listening', addr)
})