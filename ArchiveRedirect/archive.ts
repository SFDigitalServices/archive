import fetch from 'node-fetch'

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


export function getArchived (url): Promise<ArchiveSnapshot | undefined> {
  const availableUrl = new URL('https://archive.org/wayback/available')
  availableUrl.searchParams.append('url', url)
  return fetch(availableUrl.toString())
      .then(res => res.json())
      .then((data: any) => (data as AvailableResponeData).archived_snapshots.closest)
      .catch((error: Error) => {
          console.warn('unable to get archive availability for:', url, error.message)
          return undefined;
      })
}
