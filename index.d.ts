export type ArchiveMetadata = {
  collection_id: number | string
  base_url: string
  active?: boolean
}

export type RedirectMapEntry = {
  map: Record<string, string>
}

export type RedirectFileEntry = {
  file: string
  type?: string
}

export type RedirectEntry = RedirectMapEntry | RedirectFileEntry

export type StaticConfig = {
  path: string
  options?: object
}

export type SiteConfigData = {
  path: string
  archive: ArchiveMetadata
  hostnames?: string[]
  redirects?: RedirectEntry[]
  static?: StaticConfig
}

export type AppOptions = {
  sites: SiteConfigData[]
}