import { Request } from 'express'
import { URL } from 'url'

export function getRawQueryString (url: string): string {
  return url.includes('?')
    ? url.substring(url.indexOf('?') + 1)
    : undefined
}

export function getActualRequestUrl (req: Request): string {
  return `${req.protocol}://${req.hostname}${req.originalUrl}`
}

export function getHTTPSUrl (url: string): string {
  return mutateUrl(url, { protocol: 'https' })
}

export function mutateUrl (url: string | URL, props: Partial<URL>): string {
  const u: URL = new URL(String(url))
  Object.assign(u, props)
  return url.toString()
}
