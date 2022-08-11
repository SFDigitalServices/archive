const express = require('express')
const { extname } = require('node:path')
const { readFile } = require('node:fs/promises')
const { URL } = require('node:url')
const { dirname, join } = require('node:path')
const { default: anymatch } = require('anymatch')
const { unique, expandEnvVars, mergeMaps, readYAML } = require('./utils')
const { ARCHIVE_BASE_URL, REDIRECT_PERMANENT } = require('./constants')
const globby = require('globby')
const log = require('./log').scope('site')

/**
 * @typedef {import('..').SiteConfigData} SiteConfigData
 * @typedef {import('..').RedirectMap} RedirectMap
 * @typedef {import('..').RedirectEntry} RedirectEntry
 * @typedef {import('..').RedirectFileEntry} RedirectFileEntry
 * @typedef {import('..').RedirectMapEntry} RedirectMapEntry
 * @typedef {import('..').ISite} ISite
 */

const {
  // 571 is the SF Digital Services/SF.gov account
  ARCHIVE_IT_ORG_ID = '571'
} = process.env

const TIMESTAMP_LATEST = 3

/** @type {import('@types/serve-static').ServeStaticOptions} */
const defaultStaticServeOptions = {
  fallthrough: true,
  redirect: true
}

/**
 * @implements {ISite}
 */
class Site {
  /**
   * @param {string} path
   * @returns {Site}
   */
  static async load (path) {
    log.debug('loading site config:', path)
    const config = await readYAML(path)
    const site = new Site(config, path)
    await site.loadRedirects()
    return site
  }

  /**
   * @param {string | string[]} globs
   * @param {globby.GlobbyOptions} opts
   * @returns {Promise<Site[]>}
   */
  static async loadAll (globs, opts) {
    const { cwd = '.', ...rest } = opts || {}
    log.debug('loading site configs from:', globs, { cwd })
    const paths = await globby(globs, { cwd, ...rest })
    return Promise.all(
      paths.map(path => Site.load(join(cwd, path)))
    )
  }

  /**
   * @param {SiteConfigData} data
   * @returns {Site}
   */
  constructor (data, path) {
    this.config = data
    this.path = path || data.path
    this.hostnames = getHostnames(this.hostname, ...(this.config.hostnames || []))
    this.matchesHost = anymatch(this.hostnames)
    this.redirects = getInlineRedirects(this.config.redirects)
    this.log = log.scope(this.name)
  }

  get name () {
    return this.config.name
      ? `"${this.config.name}"`
      : `<${this.hostname}>`
  }

  get baseUrl () {
    const base = appendSuffix(
      this.config.base_url || this.config.archive?.base_url,
      '/'
    )
    // this will throw if either value is empty or invalid
    return new URL(base)
  }

  get collectionId () {
    return this.config.archive?.collection_id
  }

  get hostname () {
    return this.baseUrl.hostname
  }

  /**
   * Load file-based redirects from the config into this.redirects,
   * and return the Map.
   *
   * @returns {Promise<RedirectMap>}
   */
  async loadRedirects () {
    if (this.config.redirects?.length) {
      const redirects = await loadRedirects(this.config.redirects, dirname(this.path))
      for (const [from, to] of redirects.entries()) {
        this.redirects.set(from, to)
      }
    }
    return this.redirects
  }

  /**
   *
   * @param {string | string[]} uriOrUris
   * @returns {string | undefined}
   */
  resolve (uriOrUris) {
    const uris = Array.isArray(uriOrUris) ? uriOrUris : [uriOrUris]
    let resolved = uris.find(uri => this.redirects.has(uri))
    // resolve internal redirects
    while (this.redirects.has(resolved)) {
      resolved = this.redirects.get(resolved)
    }
    return resolved
  }

  /**
   * @param {string | undefined} uri
   * @returns {string | undefined}
   */
  getArchiveUrl (uri, timestamp = TIMESTAMP_LATEST) {
    const { baseUrl, collectionId } = this
    const collectionPath = collectionId ?? `org-${ARCHIVE_IT_ORG_ID}`
    const relativeUri = removeStringPrefix(uri, baseUrl.pathname)
    const path = `/${collectionPath}/${timestamp}/${baseUrl}${relativeUri}`
    return new URL(path, ARCHIVE_BASE_URL).toString()
  }

  /**
   * @returns {express.Router}
   */
  createRouter () {
    const router = new express.Router({
      caseSensitive: true,
      mergeParams: true
    })
    const path = this.baseUrl.pathname
    const handlers = []
    const staticRouter = this.createStaticRouter()
    if (staticRouter) {
      handlers.push(staticRouter)
    }
    handlers.push(this.createRequestHandler())
    return router.use(path, /** @type {express.RequestHandler} */ (req, res, next) => {
      const hostname = res.locals.hostname || req.hostname
      if (this.matchesHost(hostname)) {
        next()
      } else {
        next('router')
      }
    }, ...handlers)
  }

  /*
   * @param {{ baseUrl: string }} options
   * @returns {express.RequestHandler}
   createPassthroughProxy (options) {
     const { baseUrl } = options
     return createProxyMiddleware({
       target: baseUrl,
       changeOrigin: true,
       logLevel: 'debug',
       onProxyRes (proxyRes, req, res) {
         if (proxyRes.headers['content-type']?.includes('text/html')) {
           proxyRes.pipe(
             this.createProxyTransformStream(proxyRes, options)
             )
            }
      }
    })
  }
  */

  /*
   * @param {{ passThroughHandler?: express.RequestHandler }} options
   * @returns {express.RequestHandler}
  createArchiveProxy (options) {
     const { passThroughHandler } = options
     return createProxyMiddleware({
       baseUrl: this.getArchiveUrl('/'),
       changeOrigin: true,
       logLevel: 'debug',
       onProxyReq (proxyReq, req, res) {

      },
      onProxyRes (proxyRes, req, res) {
        if (proxyRes.statusCode === 404 && passThroughHandler) {
          return passThroughHandler(req, res)
        }
      }
    })
  }
  */

  /*
  createProxyTransformStream () {
    const rewriteUrl = this.rewriteWaybackUrl.bind(this)
    return hstream({
      // rewrite wayback URLs
      'a[href]': { href: rewriteUrl },
      'form[target]': { taret: rewriteUrl },
      'img[src]': { src: rewriteUrl },
      'link[href]': { href: rewriteUrl },
      'script[src]': { src: rewriteUrl },
      // hide the wayback banner
      'body > wb_div': {
        hidden: 'hidden',
        is: 'archive-banner'
      },
      // add our own script
      body: { _appendHtml: '<script src="/js/snapshot.js" defer></script>' }
    })
  }
  */

  /*
  rewriteWaybackUrl (url) {
    const { hostname, pathname } = new URL(url, this.baseUrl)
    if (hostname === 'wayback.archive-it.org' && pathname.startsWith('/web/')) {
      const actualUrl = pathname.replace('/web', '')
      const parsed = new URL(actualUrl)
      return this.matchesHost(parsed.hostname)
        ? url
        : actualUrl.toString()
    }
    return url
  }
  */

  /**
   * @param {object?} options
   * @returns {express.RequestHandler}
   */
  createRequestHandler (options) {
    return (req, res, next) => {
      const path = res.locals.path || req.path
      const originalUrl = res.locals.originalUrl || req.originalUrl
      this.log.info(path, originalUrl)
      const redirect = this.resolve([originalUrl, path])
      if (redirect) {
        this.log.success('redirect:', redirect)
        return res.redirect(REDIRECT_PERMANENT, redirect)
      } else {
        const archiveUrl = this.getArchiveUrl(originalUrl)
        this.log.success('archive:', archiveUrl)
        return res.redirect(REDIRECT_PERMANENT, archiveUrl)
      }
      // this.log.warn('miss')
      // return next('router')
    }
  }

  /**
   * @returns {express.Router}
   */
  createStaticRouter () {
    const { static: staticConfig } = this.config
    if (!staticConfig) return
    return express.static(staticConfig.path, Object.assign(
      { ...defaultStaticServeOptions },
      staticConfig.options
    ))
  }
}

module.exports = {
  Site,
  loadRedirects,
  loadRedirectMap
}

/**
 * @param  {...(string | string[])} urls
 * @returns {string[]}
 */
function getHostnames (...urls) {
  return urls
    .flatMap(hostname => {
      if (hostname.startsWith('.')) {
        return `*${hostname}`
      } else if (hostname.startsWith('www.')) {
        return [hostname, hostname.replace('www.', '')]
      }
      return [hostname]
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
  const map = new Map()
  if (!Array.isArray(sources)) {
    throw new Error(`Expected array of sources, but got ${typeof sources}`)
  }
  const fileMaps = await Promise.all(
    sources
      .filter(source => source.file)
      .map(({ file, ...options }) => {
        const path = relativeToPath ? join(relativeToPath, file) : file
        return loadRedirectMap(path, options)
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
 * @returns {RedirectMap}
 */
function getInlineRedirects (sources) {
  const map = new Map()
  if (!sources) return map
  const maps = sources
    .filter(source => source.map)
    .map(({ map, ...options }) => {
      return applyRedirectOptions(new Map(Object.entries(map)), options)
    })
  return mergeMaps(new Map(), ...maps)
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
async function loadRedirectMap (path, options) {
  const data = await readFile(path, 'utf8')
  const entries = data
    .split(/[\n\r]+/)
    .map(line => line.trim())
    .filter(line => line.length && !line.startsWith('#'))
    .map(line => line.split(/\s+/))
  return applyRedirectOptions(new Map(entries), options)
}

/**
 *
 * @param {RedirectMap} map
 * @param {{ 'trailing-slash': boolean }} options
 * @returns {RedirectMap}
 */
function applyRedirectOptions (map, options) {
  const {
    'trailing-slash': trailingSlash
  } = options || {}
  if (trailingSlash) {
    for (const [from, to] of map.entries()) {
      const ext = extname(from)
      if (!ext && !from.endsWith('/')) {
        map.set(`${from}/`, to)
      }
    }
  }
  return map
}

/**
 *
 * @param {string?} uri
 * @param {string} prefix
 * @returns {string}
 */
function removeStringPrefix (uri, prefix) {
  return uri?.startsWith(prefix) ? uri.slice(prefix.length) : ''
}

function appendSuffix (str, suffix) {
  return str && !str.endsWith(suffix) ? `${str}${suffix}` : str
}
