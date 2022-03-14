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
