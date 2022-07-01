const { setWorldConstructor, defineParameterType, Given, When, Then } = require('@cucumber/cucumber')
const fetch = require('node-fetch')
const expect = require('expect')
const { URL } = require('url')

const REDIRECT_PERMANENT = 301
const REDIRECT_TEMPORARY = 302

require('dotenv').config()

const { TEST_BASE_URL, PORT } = process.env

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
  await this.load(url)
})

Then('I should be redirected to {url}', function (url) {
  expect([REDIRECT_PERMANENT, REDIRECT_TEMPORARY]).toContain(this.response.status)
  expect(this.response.headers.get('Location')).toEqual(url)
})

Then('I should be redirected permanently to {url}', function (url) {
  expect(this.response.status).toBe(REDIRECT_PERMANENT)
  expect(this.response.headers.get('Location')).toEqual(url)
})

Then('I should be redirected temporarily to {url}', function (url) {
  expect(this.response.status).toBe(REDIRECT_TEMPORARY)
  expect(this.response.headers.get('Location')).toEqual(url)
})

Then('I should get status code {int}', function (code) {
  expect(this.response.status).toBe(code)
})

Then('I should get header {string} containing {string}', function (name, value) {
  expect(this.response.headers.get(name)).toContain(value)
})

Then('I should get header {string}', function (headerString) {
  const [name, value] = headerString.split(': ')
  expect(this.response.headers.get(name)).toEqual(value)
})

Then('I should get HTML title {string}', async function (title) {
  await expect(this.content).resolves.toContain(`<title>${title}</title>`)
})

setWorldConstructor(class RequestWorld {
  constructor ({ attach, parameters }) {
    this.attach = attach
    this.parameters = parameters
  }

  get baseUrl () {
    const url = this._baseUrl || this.parameters.baseUrl || getEnvTestUrl()
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
  if (TEST_BASE_URL) {
    const url = new URL(TEST_BASE_URL)
    if (PORT && !url.port) url.port = PORT
    return url.toString()
  } else {
    if (!PORT) {
      throw new Error('getEnvTestUrl() needs $PORT if $TEST_BASE_URL is unset')
    }
    return `http://localhost:${PORT}`
  }
}
