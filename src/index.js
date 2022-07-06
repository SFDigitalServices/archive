const { Router } = require('express')
const yaml = require('js-yaml')
const { readFile } = require('fs/promises')
const { URL } = require('url')
const { dirname, join } = require('path')
const { default: anymatch } = require('anymatch')
const { unique, expandEnvVars } = require('./utils')

const {
  // 571 is the SF Digital Services/SF.gov account
  ARCHIVE_IT_ORG_ID = '571'
} = process.env

const TIMESTAMP_LATEST = 3
const REDIRECT_PERMANENT = 301
const REDIRECT_TEMPORARY = 302
const ARCHIVE_BASE_URL = 'https://wayback.archive-it.org'

const AUTOMATIC_SUBDOMAINS = ['www']

// this query string parameter tells us which type of URL to get...
const ARCHIVE_TYPE_QUERY_PARAM = 'archive'
// the "permanent" archive is the most recent snapshot in archive-it
const ARCHIVE_TYPE_PERMANENT = 'perm'
// and "none" tells us to skip the archive altogether and redirect to the original
const ARCHIVE_TYPE_NONE = 'none'
// you can also set this header to force an archive type
const ARCHIVE_TYPE_HEADER = 'x-archive-type'

module.exports = {
  loadConfig,
  createSiteRouter,
  readYAML,
  getArchiveUrl,
  loadRedirects,
  loadRedirectMap,
  getHostnames,
  resolveRedirect
}

/**
 *
 * @param {string} path
 * @returns {object}
 */
async function loadConfig (path) {
  console.log('loading site config:', path)
  const config = await readYAML(path)
  config.path = path
  return config
}

/**
 *
 * @param {string} path
 * @returns {import('./types').SiteConfigData}
 */
async function readYAML (path) {
  const data = await readFile(path, 'utf8')
  return yaml.load(data)
}

/**
 *
 * @param {import('./types').SiteConfigData} config
 * @returns {Promise<import('express').Router>}
 */
async function createSiteRouter (config, env = {}) {
  const {
    archive: {
      collection_id: collectionId,
      base_url: baseUrl,
      active: archiveActive = true
    },
    hostnames = [],
    redirects = []
  } = config

  if (!baseUrl) {
    throw new Error(`No archive.base_url defined in ${config.path}`)
  } else if (!collectionId) {
    console.warn(`No archive.collection_id in ${config.path}; `)
  }

  const baseHostname = new URL(baseUrl).hostname
  const allHostnames = hostnames.length
    ? getHostnames(...hostnames)
    : getHostnames(baseHostname)
  if (allHostnames.length === 0) {
    console.warn('No hostnames found in %s; no router will be created', config.path)
    return (req, res, next) => next('router')
  } else {
    for (const hostname of allHostnames) {
      console.log('+ host: %s (%s)', hostname, config.path)
    }
  }

  const relativeDir = dirname(config.path)
  const redirectMap = await loadRedirects(redirects, relativeDir)
  const hostMatch = anymatch(allHostnames)
  return Router({
    caseSensitive: true,
    mergeParams: true
  })
    .use((req, res, next) => {
      if (!hostMatch(req.hostname)) {
        return next('router')
      }

      const redirect = resolveRedirect([req.path, req.originalUrl], redirectMap)
      const archiveType = req.query[ARCHIVE_TYPE_QUERY_PARAM] || req.get(ARCHIVE_TYPE_HEADER)

      /**
       *
       */
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
        return hostname.substring(1)
      } else
      if (hostname.startsWith('.')) {
        return `*${hostname}`
      } else if (hostname.startsWith('www.')) {
        return [hostname, hostname.replace('www.', '')]
      }
      return [
        hostname,
        ...AUTOMATIC_SUBDOMAINS.map(sub => `${sub}.${hostname}`)
      ]
    })
    .filter(unique)
    .map(host => expandEnvVars(host))
}

/**
 *
 * @param {import('./types').RedirectEntry[]} sources
 * @param {string} relativeToPath
 * @returns {Promise<Map<string, string>>}
 */
async function loadRedirects (sources, relativeToPath = '.') {
  const map = new Map()
  for (const source of sources) {
    if (source?.map) {
      for (const [from, to] of Object.entries(source.map)) {
        map.set(from, to)
      }
    } else if (source.file) {
      const path = join(relativeToPath, source.file)
      const lines = await loadRedirectMap(path)
      for (const [from, to] of lines) {
        map.set(from, to)
      }
    } else {
      console.warn('invalid redirect map source:', source)
    }
  }
  return map
}

/**
 *
 * @param {string} path
 * @returns {Promise<string[][]>}
 */
async function loadRedirectMap (path) {
  const data = await readFile(path, 'utf8')
  return data
    .split(/[\r\n]+/)
    .map(line => line.trim())
    .filter(line => line.length && !line.startsWith('#'))
    .map(line => line.split(/\s+/))
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
