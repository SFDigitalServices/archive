import { Request, Response } from 'express'

export default function errorHandler (req: Request, res: Response): void {
  res.status(404).send('Not found')
}