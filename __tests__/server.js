const express = require('express')
const createApp = require('../src/app')
const supertest = require('supertest')

const allowedMethods = ['GET', 'HEAD', 'OPTIONS']
const notAllowedMethods = [
  'DELETE',
  'PATCH',
  'POST',
  'PUT',
  'TRACE'
]

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
