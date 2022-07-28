const express = require('express')
const { readFile } = require('node:fs/promises')
const { URL } = require('node:url')
const { dirname, join } = require('node:path')
const { default: anymatch } = require('anymatch')
const { unique, expandEnvVars, mergeMaps, readYAML } = require('./utils')
const globby = require('globby')
const vhost = require('vhost')

/**
 * @typedef {import('..').SiteConfigData} SiteConfigData
 * @typedef {import('..').RedirectMap} RedirectMap
 * @typedef {import('..').RedirectEntry} RedirectEntry
 * @typedef {import('..').RedirectFileEntry} RedirectFileEntry
 * @typedef {import('..').RedirectMapEntry} RedirectMapEntry
 */

const {
  // 571 is the SF Digital Services/SF.gov account
  ARCHIVE_IT_ORG_ID = '571'
} = process.env

const TIMESTAMP_LATEST = 3
const REDIRECT_PERMANENT = 301
const REDIRECT_TEMPORARY = 302
const ARCHIVE_BASE_URL = 'https://wayback.archive-it.org'

// subdomains that should be implicitly/automatically respected
// for every unique hostname in each site
const IMPLICIT_SUBDOMAINS = ['www']

// this query string parameter tells us which type of URL to get...
const ARCHIVE_TYPE_QUERY_PARAM = 'archive'
// the "permanent" archive is the most recent snapshot in archive-it
const ARCHIVE_TYPE_PERMANENT = 'perm'
// and "none" tells us to skip the archive altogether and redirect to the original
const ARCHIVE_TYPE_NONE = 'none'
// you can also set this header to force an archive type
const ARCHIVE_TYPE_HEADER = 'x-archive-type'

class Site {
  /**
   * @param {string} path
   * @returns {Site}
   */
  static async load (path) {
    const config = await loadSite(path)
    return new Site(config)
  }

  /**
   * @param {SiteConfigData} data
   * @returns {Site}
   */
  constructor (data) {
    this.config = data
    this.matchesHost = anymatch(this.hostnames)
    this.redirects = getInlineRedirects(this.config.redirects)
  }

  get baseUrl () {
    // this will throw if either value is empty or invalid
    return new URL(
      this.config.base_url ||
      this.config.archive.base_url
    )
  }

  get collectionId () {
    return this.config.archive?.collection_id
  }

  get hostname () {
    return this.baseUrl.hostname
  }

  /**
   * @returns {string[]}
   */
  get hostnames () {
    return getHostnames(this.hostname, ...(this.config.hostnames || []))
  }

  /**
   * Load file-based redirects from the config into this.redirects,
   * and return the Map.
   *
   * @returns {Promise<RedirectMap>}
   */
  async loadRedirects () {
    const redirects = await loadRedirects(this.config.redirects, dirname(this.config.path))
    for (const [from, to] of redirects.entries()) {
      this.redirects.set(from, to)
    }
    return this.redirects
  }

  /**
   *
   * @param {string | URL} url
   * @returns {string | undefined}
   */
  resolve (...uris) {
    let redirect = uris.find(uri => this.redirects.has(uri))
    // resolve internal redirects
    while (this.redirects.has(redirect)) {
      redirect = this.redirects.get(redirect)
    }
    return redirect
  }

  /**
   * @param {string | undefined} uri
   * @returns {string | undefined}
   */
  getArchiveUrl (uri) {
    const { baseUrl, collectionId } = this
    const collectionPath = collectionId ?? `org-${ARCHIVE_IT_ORG_ID}`
    return `${ARCHIVE_BASE_URL}/${collectionPath}/${TIMESTAMP_LATEST}/${baseUrl}${uri || ''}`
  }

  /**
   * @returns {express.Router}
   */
  createRouter () {
    const router = new express.Router()
    const staticRouter = this.createStaticRouter()
    if (staticRouter) router.use(staticRouter)
    router.use(this.createRequestHandler())
    return router
  }

  /**
   * @returns {express.RequestHandler}
   */
  createRequestHandler () {
    return (req, res, next) => {
      if (!this.matchesHost(req.hostname)) {
        return next('router')
      }
      const redirect = this.resolve([req.originalUrl, req.path])
      if (redirect) {
        return res.redirect(redirect, REDIRECT_PERMANENT)
      } else {
        const archiveUrl = this.getArchiveUrl(req.originalUrl)
        if (archiveUrl) {
          return res.redirect(archiveUrl, REDIRECT_PERMANENT)
        }
      }
      return next('router')
    }
  }

  /**
   * @returns {express.Router}
   */
  createStaticRouter () {
    const { static: staticConfig } = this.config
    if (!staticConfig) return

    const router = new express.Router()
    const serveStatic = express.static(staticConfig.path, staticConfig.options)
    for (const host of this.hostnames) {
      router.use(vhost(host, serveStatic))
    }
    return router
  }
}

module.exports = {
  Site,
  loadSite,
  loadSites,
  createSiteRouter,
  loadRedirects,
  loadRedirectMap
}

/**
 *
 * @param {string} path
 * @returns {Promise<SiteConfigData>}
 */
async function loadSite (path) {
  // console.warn('loading site config:', path)
  const config = await readYAML(path)
  config.path = path
  return config
}

/**
 * Load all site configs from a directory.
 *
 * @param {string | string[]} globs
 * @param {{ cwd?: string }} cwd
 * @returns {Promise<SiteConfigData[]>}
 */
async function loadSites (globs, opts) {
  const { cwd = '.', ...rest } = opts || {}
  const paths = await globby(globs, { cwd, ...rest })
  return Promise.all(
    paths.map(path => loadSite(join(cwd, path)))
  )
}

/**
 *
 * @param {SiteConfigData} config
 * @returns {Promise<Router>}
 */
async function createSiteRouter (config) {
  const {
    archive: {
      collection_id: collectionId,
      base_url: baseUrl,
      active: archiveActive = true
    },
    hostnames = [],
    redirects = [],
    static: staticConfig,
    path
  } = config

  if (!baseUrl) {
    throw new Error(`No archive.base_url defined in ${path}`)
  } else if (!collectionId) {
    console.warn(`No archive.collection_id in ${path}; `)
  }

  const baseHostname = new URL(baseUrl).hostname
  const allHostnames = hostnames.length
    ? getHostnames(...hostnames)
    : getHostnames(baseHostname)
  if (allHostnames.length === 0) {
    console.warn('No hostnames found in %s; no router will be created', path)
    return (req, res, next) => next('router')
  } else {
    for (const hostname of allHostnames) {
      console.warn('+ host: %s (%s)', hostname, path)
    }
  }

  const relativeDir = dirname(path)
  const redirectMap = await loadRedirects(redirects, relativeDir)
  const hostMatch = anymatch(allHostnames)
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true
  })

  if (staticConfig) {
    const serveStatic = express.static(staticConfig.path, staticConfig.options)
    router.use(...allHostnames.map(host => vhost(host, serveStatic)))
  }

  router.use((req, res, next) => {
    if (!hostMatch(req.hostname)) {
      return next('router')
    }

    const redirect = resolveRedirect([req.path, req.originalUrl], redirectMap)
    const archiveType = req.query[ARCHIVE_TYPE_QUERY_PARAM] || req.get(ARCHIVE_TYPE_HEADER)

    if (archiveType === ARCHIVE_TYPE_NONE || (!redirect && !archiveActive)) {
      const passThroughUrl = new URL(`${baseUrl}${req.originalUrl}`)
      passThroughUrl.searchParams.delete(ARCHIVE_TYPE_QUERY_PARAM)
      return res.redirect(REDIRECT_TEMPORARY, String(passThroughUrl))
    } else if (redirect && archiveType !== ARCHIVE_TYPE_PERMANENT) {
      return res.redirect(REDIRECT_PERMANENT, redirect)
    } else {
      const archiveUrl = getArchiveUrl(req.originalUrl, { baseUrl, collectionId })
      return res.redirect(REDIRECT_PERMANENT, archiveUrl)
    }
  })

  return router
}

/**
 *
 * @param {string} uri
 * @param {{ baseUrl: string, collectionId: string | number }} options
 * @returns
 */
function getArchiveUrl (uri, { baseUrl, collectionId }) {
  const collectionPath = collectionId ?? `org-${ARCHIVE_IT_ORG_ID}`
  return `${ARCHIVE_BASE_URL}/${collectionPath}/${TIMESTAMP_LATEST}/${baseUrl}${uri || ''}`
}

/**
 *
 * @param  {...string} urls
 * @returns {string[]}
 */
function getHostnames (...urls) {
  return urls
    .flatMap(hostname => {
      // a "^" at the beginning indicates an exact domain match only
      // (no automatic subdomains or wildcards)
      if (hostname.startsWith('^')) {
        return hostname.slice(1)
      } else
      if (hostname.startsWith('.')) {
        return `*${hostname}`
      } else if (hostname.startsWith('www.')) {
        return [hostname, hostname.replace('www.', '')]
      }
      return [
        hostname,
        ...IMPLICIT_SUBDOMAINS.map(sub => `${sub}.${hostname}`)
      ]
    })
    .filter(unique)
    .map(host => expandEnvVars(host))
}

/**
 *
 * @param {RedirectEntry[]} sources
 * @param {string} relativeToPath
 * @returns {Promise<Map<string, string>>}
 */
async function loadRedirects (sources, relativeToPath = '.') {
  const map = getInlineRedirects(sources)
  const fileMaps = await Promise.all(
    sources
      .filter(source => source.file)
      .map(({ file }) => {
        const path = relativeToPath ? join(relativeToPath, file) : file
        return loadRedirectMap(path)
          .then(lines => new Map(lines))
      })
  )
  return mergeMaps(map, ...fileMaps)
}

/**
 * Collect all of the redirect entries with a "map" object
 * into a single Map (from URI => to URL). Keys are merged
 * in the order they're defined.
 *
 * @param {RedirectMapEntry[]} sources
 * @returns {Promise<RedirectMap>}
 */
function getInlineRedirects (sources) {
  const map = new Map()
  if (!sources) return map
  const entries = sources
    .filter(source => source.map)
    .flatMap(source => Object.entries(source.map))
  return new Map(entries)
}

/**
 * Read redirect paths from a file into a single Map. Files are assumed to
 * consist of zero or more lines with whitespace-separated "columns". Empty
 * lines and those beginning with "#" are ignored.
 *
 * ```
 * # this is a comment, and will be ignored
 * # the first and second columns can be separated by any number of spaces or tabs
 * /foo  https://sf.gov/foo
 * # any additional "columns" (after the URL) will be ignored
 * /bar  https://sf.gov # you can put comments here, too
 * ```
 *
 * @param {string} path
 * @returns {Promise<RedirectMap>}
 */
async function loadRedirectMap (path) {
  const data = await readFile(path, 'utf8')
  const entries = data
    .split(/[\n\r]+/)
    .map(line => line.trim())
    .filter(line => line.length && !line.startsWith('#'))
    .map(line => line.split(/\s+/))
  return new Map(entries)
}

/**
 *
 * @param {string[]} uris
 * @param {Map<string, string>} redirectMap
 * @returns
 */
function resolveRedirect (uris, redirectMap) {
  let uri = uris.find(uri => redirectMap.has(uri))
  while (uri && redirectMap.has(uri)) {
    uri = redirectMap.get(uri)
  }
  return uri
}
