const { setWorldConstructor, defineParameterType, Given, When, Then } = require('@cucumber/cucumber')
const fetch = require('node-fetch')
const expect = require('expect')
const { URL } = require('url')

require('dotenv').config()

// console.info('TEST_BASE_URL:', process.env.TEST_BASE_URL)

defineParameterType({
  name: 'url',
  regexp: /[^\s]+/,
  transform (str) {
    return this.getFullUrl(str)
  }
})

Given('test base URL {url}', function (url) {
  this.baseUrl = url
})

Given('request headers:', function (data) {
  this.headers = Object.fromEntries(data.rawTable)
})

When('I visit {url}', async function (url) {
  url = envsubst(url)
  await this.load(url)
})

Then('I should be redirected to {url}', function (url) {
  url = envsubst(url)
  expect(this.response.status).toBe(302)
  expect(this.response.headers.get('Location')).toEqual(url)
})

Then('I should get status code {int}', function (code) {
  expect(this.response.status).toBe(code)
})

Then('I should get header {string} containing {string}', function (name, value) {
  value = envsubst(value)
  expect(this.response.headers.get(name)).toContain(value)
})

Then('I should get header {string}', function (headerString) {
  const [name, value] = envsubst(headerString).split(': ')
  expect(this.response.headers.get(name)).toEqual(value)
})

Then('I should get HTML title {string}', async function (title) {
  const html = `<title>${envsubst(title)}</title>`
  await expect(this.content).resolves.toContain(html)
})

setWorldConstructor(class RequestWorld {
  constructor ({ attach, parameters }) {
    this.attach = attach
    this.parameters = parameters
    this._headers = {}
  }

  get headers () {
    return this._headers
  }

  set headers (values) {
    this._headers = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        envsubst(value)
      ])
    )
  }
  
  get baseUrl () {
    const url =  this._baseUrl || this.parameters.baseUrl || getEnvTestUrl()
    if (!url) {
      throw new Error(`Cannot determine base URL from parameters: ${JSON.stringify(this.parameters, null, 2)}`)
    }
    return this.headers?.Host
      ? url.replace(/^https:/, 'http:')
      : url
  }

  set baseUrl (url) {
    this._baseUrl = url
  }

  getFullUrl (str, defaultProtocol = 'http') {
    if (str.includes('://')) {
      return new URL(str)
    } else if (str.startsWith('/')) {
      return new URL(str, this.baseUrl)
    } else {
      return new URL(`${defaultProtocol}://${str}`)
    }
  }

  async load (url, options = {}) {
    const fullUrl = this.getFullUrl(url)
    const res = await fetch(fullUrl, {
      headers: this.headers,
      redirect: 'manual',
      ...options
    })
    this.response = res
  }

  get content () {
    return this.response.headers.get('content-type')?.includes('/json')
      ? this.response.json()
      : this.response.text()
  }
})

function getEnvTestUrl () {
  const { TEST_BASE_URL, PORT } = process.env
  if (TEST_BASE_URL) {
    const url = new URL(TEST_BASE_URL)
    if (PORT && !url.port) url.port = PORT
    return url.toString()
  }
}

function envsubst (input) {
  return input
    .replace(/\$\{([a-z][^}]+)}/g, (_, key) => process.env[key] || '')
    .replace(/\$([a-z]\w+)/gi, (_, key) => process.env[key] || '')
}