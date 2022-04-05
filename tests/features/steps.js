const { parseResponse } = require('parse-raw-http').parseResponse // derp
const { setWorldConstructor, defineParameterType, Given, When, After, Before, Then } = require('@cucumber/cucumber')
const { spawnSync } = require('child_process')
const fetch = require('node-fetch')
const expect = require('expect')
const { URL } = require('url')

require('dotenv').config({
  path: '..'
})

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
  expect(this.response.status).toBe(302)
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
    const url =  this._baseUrl || this.parameters.baseUrl || process.env.TEST_BASE_URL
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
