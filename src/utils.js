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
function expandEnvVars (str, vars = process.env) {
  if (typeof str !== 'string') {
    throw new Error(`Expected string to expand, but got ${typeof str}`)
  }
  return str
    .replace(/\${(\w+)}/g, (_, key) => vars?.[key] || '')
    .replace(/\$(\w+)/g, (_, key) => vars?.[key] || '')
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
    for (const [k, v] of other.entries()) {
      map.set(k, v)
    }
  }
  return map
}
