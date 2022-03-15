import { Request } from 'express'

/**
 * Get the "raw" query string from a URL or URI (typically a Request's
 * `originalUrl`).
 * @param url A URL or URI (not validated as a full-qualified URL)
 * @returns the portion of the URI after the first "?", or undefined
 */
export function getRawQueryString (url: string): string {
  return url?.includes('?')
    ? url.substring(url.indexOf('?') + 1)
    : undefined
}

/**
 * Get the full request URL of an Express Request (or Request-shaped object).
 * @param req the request
 * @returns a fully-qualified URL
 */
export function getActualRequestUrl (req: Partial<Request>): string {
  if (!req.protocol) {
    throw new Error(`Request has no protocol: "${req.url}"`)
  } else if (!req.hostname) {
    throw new Error(`Request has no hostname: "${req.url}"`)
  }
  return `${req.protocol}://${req.hostname}${req.originalUrl || ''}`
}

/**
 * Replace the "http" protocol at the beginning of a URL string with "https".
 * @param url the URL
 * @returns a URL with "https://" at the beginning
 */
export function getHttpsUrl (url: string): string {
  return url?.replace(/^http:/, 'https:')
}

/**
 * Append query string parameters to a URL string (with or without a query
 * string originally).
 *
 * @param url the original URL
 * @param query key/value query string parameters
 * @returns the new URL
 */
export function getUrlWithParams (url: string, query: object): string {
  const out = new URL(url)
  for (const [key, value] of Object.entries(query)) {
    out.searchParams.set(key, value as string)
  }
  return out.href
}
