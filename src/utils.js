const protocolPrefixPattern = /^https?:\/\//

module.exports = {
  expandEnvVars,
  mergeMaps,
  unique,
  getFullUrl
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

/**
 *
 * @param {string} url
 * @param {string?} defaultProtocol
 * @returns {URL}
 */
function getFullUrl (url, defaultProtocol = 'https') {
  if (protocolPrefixPattern.test(url)) {
    return new URL(url)
  } else if (url.startsWith('//')) {
    return new URL(`${defaultProtocol}:${url}`)
  } else {
    return new URL(`${defaultProtocol}://${url}`)
  }
}
