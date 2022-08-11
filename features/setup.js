const { setWorldConstructor, defineParameterType, Given, When, Then } = require('@cucumber/cucumber')
const fetch = require('node-fetch')
const expect = require('expect')
const { URL } = require('node:url')
const { expandEnvVars, getFullUrl } = require('../src/utils')
const { REDIRECT_PERMANENT, REDIRECT_TEMPORARY } = require('../src/constants')

require('dotenv').config()

const anyRedirectStatus = [REDIRECT_PERMANENT, REDIRECT_TEMPORARY]

const {
  TEST_BASE_URL,
  PORT,
  NODE_ENV,
  DEBUG
} = process.env

defineParameterType({
  name: 'url',
  regexp: /\S+/,
  transformer (str) {
    return expandEnvVars(str)
  }
})

defineParameterType({
  name: 'header',
  regexp: /[^\s:]+:\s+.+/,
  transformer (str) {
    return str.split(/:\s+/, 2)
  }
})

Given('test base URL {url}', function (url) {
  this.baseUrl = url
})

Given('request header {header}', function ([name, value]) {
  this.headers[name] = expandEnvVars(value)
})

Given('request headers:', function (data) {
  this.headers = Object.fromEntries(
    data.rawTable.map(row => row.map(expandEnvVars))
  )
})

When('I visit {url}', async function (url) {
  await this.load(expandEnvVars(url))
})

Then('I should be redirected to {url}', function (url) {
  expect(this.response).toRedirectTo(expandEnvVars(url))
})

Then('I follow the redirect', async function () {
  expect(this.response?.headers.get('location')).toBeTruthy()
  await this.followRedirect()
})

Then('I should be redirected permanently to {url}', function (url) {
  expect(this.response).toRedirectTo(expandEnvVars(url), REDIRECT_PERMANENT)
})

Then('I should be redirected temporarily to {url}', function (url) {
  expect(this.response).toRedirectTo(expandEnvVars(url), REDIRECT_TEMPORARY)
})

Then('I should get status code {int}', function (code) {
  expect(this.response.status).toBe(code)
})

Then('I should get header {string} containing {string}', function (name, value) {
  expect(this.response.headers.get(name)).toContain(expandEnvVars(value))
})

Then('I should get header {header}', function ([name, value]) {
  expect(this.response.headers.get(name)).toEqual(expandEnvVars(value))
})

Then('I should get HTML title {string}', async function (title) {
  await expect(this.content).resolves.toContain(`<title>${title}</title>`)
})

setWorldConstructor(class RequestWorld {
  constructor ({ attach, parameters }) {
    this.attach = attach
    this.parameters = parameters
    this.headers = {}
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
    return str.startsWith('/')
      ? new URL(str, this.baseUrl)
      : getFullUrl(str, defaultProtocol)
  }

  async load (url, options = {}) {
    const fullUrl = this.getFullUrl(url)
    debug("curl '%s' %s", fullUrl, Object.entries(this.headers).map(([h, v]) => `-H '${h}: ${v}'`).join(' '))
    this.response = await fetch(fullUrl, {
      headers: this.headers,
      redirect: 'manual',
      ...options
    })
  }

  async followRedirect (options = {}) {
    const url = this.response.headers.get('location')
    this.response = await fetch(url, {
      headers: omit(this.headers, ['host']),
      ...options
    })
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
  } else if (!PORT) {
    throw new Error('getEnvTestUrl() needs $PORT if $TEST_BASE_URL is unset')
  }
  return `http://localhost:${PORT}`
}

expect.extend({
  /**
   *
   * @param {fetch.Response} res
   * @param {string} url
   * @param {number} expectedStatus
   * @returns {{ pass: boolean, message: () => string }}
   */
  toRedirectTo (res, url, expectedStatus) {
    const { status, headers } = res
    const matchesStatus = expectedStatus
      ? status === expectedStatus
      : anyRedirectStatus.includes(status)
    const locationHeader = headers.get('Location')
    const locationMatch = locationHeader === url
    return {
      pass: matchesStatus && locationMatch,
      message () {
        return matchesStatus
          ? `Expected Location header to match:\n\t${url}\nbut got:\n\t${locationHeader}`
          : `Expected HTTP status ${expectedStatus || anyRedirectStatus.join(' or ')}, but got ${status}`
      }
    }
  }
})

function debug (...args) {
  if (NODE_ENV === 'development' || DEBUG === '1') {
    console.warn(...args)
  }
}

function omit (obj, keys) {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([name]) => !keys.includes(name.toLowerCase()))
  )
}
