const yaml = require('js-yaml')
const { extname } = require('node:path')
const { readFile } = require('node:fs/promises')
const { join } = require('node:path')
const { unique, expandEnvVars, mergeMaps } = require('./utils')

/**
 * @typedef {import('..').SiteConfigData} SiteConfigData
 * @typedef {import('..').RedirectMap} RedirectMap
 * @typedef {import('..').RedirectEntry} RedirectEntry
 * @typedef {import('..').RedirectOptions} RedirectOptions
 * @typedef {import('..').RedirectFileEntry} RedirectFileEntry
 * @typedef {import('..').RedirectMapEntry} RedirectMapEntry
 */

module.exports = {
  getHostnames,
  getInlineRedirects,
  loadRedirects,
  loadRedirectMap,
  readYAML
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
    .filter(host => !host.startsWith('.'))
}

/**
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
 * @param {RedirectOptions} options
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
 * @param {RedirectMap} map
 * @param {RedirectOptions} options
 * @returns {RedirectMap}
 */
function applyRedirectOptions (map, options) {
  const {
    'trailing-slash': trailingSlash
  } = options
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
 * @param {string} path
 * @returns {Promise<SiteConfigData>}
 */
async function readYAML (path) {
  const data = await readFile(path, 'utf8')
  return yaml.load(data)
}
