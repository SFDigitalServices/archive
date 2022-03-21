import { Request, Response } from 'express'
import fetch from 'node-fetch'
import {
  getActualRequestUrl,
  getHttpsUrl,
  getRawQueryString,
  getUrlWithParams
} from './url'

const {
  WAYBACK_AVAILABLE_API = 'https://archive.org/wayback/available'
} = process.env

export { WAYBACK_AVAILABLE_API }

export type ArchiveSnapshot = {
  status: string;
  available: boolean;
  url: string;
  timestamp: string;
}

export type ArchivedSnapshotsData = {
  closest?: ArchiveSnapshot;
}

export type AvailableResponseData = {
  url: string;
  archived_snapshots?: ArchivedSnapshotsData;
}

export async function getArchived (url: string): Promise<ArchiveSnapshot> {
  const available = await getAvailable(url)
  return available?.archived_snapshots.closest
}

export async function getAvailable (url: string): Promise<AvailableResponseData> {
  const availableUrl: string = getUrlWithParams(WAYBACK_AVAILABLE_API, { url })
  try {
    const res = await fetch(availableUrl)
    const data = await res.json() as AvailableResponseData
    return data
  } catch (error: unknown) {
    const message: string = (error instanceof Error)
      ? error.message
      : String(error)
    console.warn('unable to get archive availability for:', url, message)
    return undefined
  }
}

export async function archiveRedirectHandler (req: Request, res: Response, next: CallableFunction):Promise<void> {
  const url: string = res.locals.url as string || getRequestUrl(req)
  console.log('[archive] testing: "%s" (requested host: "%s", url: "%s")', url, req.hostname, req.originalUrl)
  const archived: ArchiveSnapshot = await getArchived(url)
  if (archived) {
    console.log('[archive] 200: "%s" → "%s"', url, archived.url)
    const secureUrl: string = getHttpsUrl(archived.url)
    res.redirect(301, secureUrl)
  } else {
    console.warn('[archive] 404: "%s"', url)
    next()
  }
}

export function getRequestUrl (req: Partial<Request>): string {
  return req.params?.url ||
    (req.query?.url as string) ||
    getRawQueryString(req.originalUrl) ||
    getActualRequestUrl(req)
}
