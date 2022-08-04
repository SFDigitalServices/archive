const express = require('express')
const supertest = require('supertest')
const createApp = require('../src/app')

const allowedMethods = ['GET', 'HEAD', 'OPTIONS']
const notAllowedMethods = [
  'DELETE',
  'PATCH',
  'POST',
  'PUT',
  'TRACE'
]

describe('createApp()', () => {
  it('defaults to no options', async () => {
    await expect(createApp()).resolves.toBeInstanceOf(Function)
    await expect(createApp({})).resolves.toBeInstanceOf(Function)
    await expect(createApp({ sites: [] })).resolves.toBeInstanceOf(Function)
  })

  it('does not throw if a site is misconfigured', async () => {
    await expect(createApp({ sites: [null] })).resolves.toBeInstanceOf(Function)
    await expect(createApp({ sites: ['not a site'] })).resolves.toBeInstanceOf(Function)
    await expect(createApp({ sites: [{ also: 'not a site' }] })).resolves.toBeInstanceOf(Function)
  })
})

describe('server logic', () => {
  describe.skip('allowed methods', () => {
    it('allows read-only HTTP verbs', async () => {
      const server = await createServer({ sites: [] })
      for (const method of allowedMethods) {
        expect(testRequest(server, '/', method)).toResolveWithStatus(404)
      }
    })

    it('does not allow other HTTP verbs', async () => {
      const server = await createServer({ sites: [] })
      for (const method of notAllowedMethods) {
        expect(testRequest(server, '/', method)).toResolveWithStatus(405)
      }
    })
  })
})

async function createServer (options) {
  const app = await createApp(options)
  return express().use(app)
}

async function testRequest (app, url, method = 'GET') {
  return supertest(app)[method.toLowerCase()](url)
}

expect.extend({
  async toResolveWithStatus (test, expectedStatus) {
    const { status } = await test
    return {
      pass: status === expectedStatus,
      message: () => `${this.utils.printExpected(expectedStatus)} !== ${this.utils.printReceived(status)}`
    }
  }
})
