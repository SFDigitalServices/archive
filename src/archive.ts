import fetch from 'node-fetch'
import { Request, Response } from 'express'
import { getRawQueryString, getActualRequestUrl, getHTTPSUrl } from './url'

const {
  WAYBACK_AVAILABLE_API = 'https://archive.org/wayback/available'
} = process.env

export function getArchived (url: string): Promise<ArchiveSnapshot | undefined> {
  const availableUrl = new URL(WAYBACK_AVAILABLE_API)
  availableUrl.searchParams.append('url', url)
  return fetch(availableUrl.toString())
  .then(res => res.json())
  .then((data: object) => (data as AvailableResponeData).archived_snapshots.closest)
  .catch((error: Error) => {
    console.warn('unable to get archive availability for:', url, error.message)
    return undefined
  })
}

export async function archiveRedirectHandler (req: Request, res: Response, next: Function):Promise<void> {
  const url: string = getRequestUrl(req)
  console.log('[archive] testing: "%s" (requested host: "%s", url: "%s")', url, req.hostname, req.originalUrl)
  const archived: ArchiveSnapshot = await getArchived(url)
  if (archived) {
    console.log('[archive] 200: "%s" → "%s"', url, archived.url)
    const secureUrl: string = getHTTPSUrl(archived.url)
    res.redirect(301, secureUrl)
  } else {
    console.warn('[archive] 404: "%s"', url)
    next()
  }
}

export function getRequestUrl (req: Request): string {
  return (req.params.url as string)
  || (req.query.url as string)
  || getRawQueryString(req.originalUrl)
  || getActualRequestUrl(req)
}

export type AvailableResponeData = {
  url: string;
  archived_snapshots?: ArchivedSnapshotsData;
}

export type ArchivedSnapshotsData = {
  closest?: ArchiveSnapshot;
}

export type ArchiveSnapshot = {
  status: string;
  available: boolean;
  url: string;
  timestamp: string;
}
