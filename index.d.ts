import type express from 'express'
import type { ServeStaticOptions } from '@types/serve-static'

export type ArchiveMetadata = {
  collection_id: number | string
  base_url?: string
  active?: boolean
}

export type RedirectMap = Map<string, string>

export type RedirectOptions = {
  'trailing-slash': boolean
}

export type RedirectMapEntry = {
  map: Record<string, string>
} & RedirectOptions

export type RedirectFileEntry = {
  file: string
} & RedirectOptions

export type RedirectEntry = RedirectMapEntry | RedirectFileEntry

export type StaticConfig = {
  path: string
  options?: ServeStaticOptions
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