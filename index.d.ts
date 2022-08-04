import express from 'express'

export type ArchiveMetadata = {
  collection_id: number | string
  base_url?: string
  active?: boolean
}

export type RedirectMap = Map<string, string>

export type RedirectMapEntry = {
  map: Record<string, string>
}

export type RedirectFileEntry = {
  file: string
}

export type RedirectEntry = RedirectMapEntry | RedirectFileEntry

export type StaticConfig = {
  path: string
  options?: object
}

export type SiteConfigData = {
  archive: ArchiveMetadata
  base_url?: string
  hostnames?: string[]
  name?: string
  redirects?: RedirectEntry[]
  static?: StaticConfig
}

export type AppOptions = {
  sites: ISite[]
  allowedMethods: string[]
}

export interface ISite {
  name: string
  path?: string
  baseUrl: URL
  collectionId?: number
  hostnames?: string[]
  config: SiteConfigData
  createRouter: () => express.RequestHandler
}