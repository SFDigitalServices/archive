const yaml = require('js-yaml')
const { readFile } = require('node:fs/promises')

/**
 * @typedef {import('..').SiteConfigData} SiteConfigData
 */

module.exports = {
  expandEnvVars,
  mergeMaps,
  readYAML,
  unique
}

/**
 * @param {string} str
 * @param {Record<string, string>} vars
 * @returns {string}
 */
function expandEnvVars (str, vars = {}) {
  return str
    .replace(/\${(\w+)}/g, (_, key) => vars[key] || '')
    .replace(/\$(\w+)/g, (_, key) => vars[key] || '')
}

function unique (value, index, list) {
  return list.indexOf(value) === index
}

/**
 *
 * @param {string} path
 * @returns {Promise<SiteConfigData>}
 */
async function readYAML (path) {
  const data = await readFile(path, 'utf8')
  return yaml.load(data)
}

/**
 * Merge one or more maps into the first Map passed
 *
 * @param {Map<any, any>} map
 * @param {...Map<any, any>} rest
 * @returns {Map<any, any>}
 */
function mergeMaps (map, ...rest) {
  for (const other of rest.flat()) {
    if (!other) continue
    for (const [k, v] of other.entries()) {
      map.set(k, v)
    }
  }
  return map
}
