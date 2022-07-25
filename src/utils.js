const yaml = require('js-yaml')
const { readFile } = require('node:fs/promises')

/**
 * @typedef {import('..').SiteConfigData} SiteConfigData
 */

module.exports = {
  expandEnvVars,
  readYAML,
  unique
}

function expandEnvVars (str, vars = process.env) {
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
 * @returns {SiteConfigData}
 */
async function readYAML (path) {
  const data = await readFile(path, 'utf8')
  return yaml.load(data)
}
