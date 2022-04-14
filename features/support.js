const { URL } = require('url')

module.exports = {
  getEnvTestUrl,
  envsubst
}

function getEnvTestUrl () {
  const { TEST_BASE_URL, PORT } = process.env
  if (TEST_BASE_URL) {
    const url = new URL(TEST_BASE_URL)
    if (PORT && !url.port) url.port = PORT
    return url.toString()
  }
}

function envsubst (input) {
  return input.replace(/\$\{?([a-z]\w+)\}?/gi, (_, key) => process.env[key] || '')
}
