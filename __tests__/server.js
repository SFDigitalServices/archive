
const express = require('express')
const supertest = require('supertest')
const createApp = require('../src/app')
const { Site } = require('../src/sites')

require('../lib/test-setup')

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

describe('url aliasing at /_/', () => {
  let server
  beforeAll(async () => {
    server = await createServer({
      sites: [
        new Site({
          name: 'a',
          base_url: 'https://a.com',
          hostnames: ['www.a.com'],
          archive: {
            collection_id: 123
          },
          redirects: [
            {
              map: {
                '/': 'https://example.com/a'
              }
            }
          ]
        }),
        new Site({
          name: 'b',
          base_url: 'https://b.com',
          hostnames: ['www.b.com'],
          redirects: [
            {
              map: {
                '/': 'https://example.com/b'
              }
            }
          ]
        })
      ]
    })
  })

  it('routes url alias redirects', async () => {
    await expect(supertest(server).get('/_/a.com'))
      .resolves.toBeSupertestRedirect('https://example.com/a')
    await expect(supertest(server).get('/_/www.a.com'))
      .resolves.toBeSupertestRedirect('https://example.com/a')
    await expect(supertest(server).get('/_/b.com'))
      .resolves.toBeSupertestRedirect('https://example.com/b')
    await expect(supertest(server).get('/_/www.b.com'))
      .resolves.toBeSupertestRedirect('https://example.com/b')
  })

  it('404s on unhandled domains', async () => {
    await expect(supertest(server).get('/_/c.com'))
      .resolves.toMatchObject({ statusCode: 404 })
  })

  it('40Xs on bad URLs', async () => {
    await expect(supertest(server).get('/_/://'))
      .resolves.toMatchObject({ statusCode: 404 })
    await expect(supertest(server).get('/_/:://'))
      .resolves.toMatchObject({ statusCode: 404 })
    await expect(supertest(server).get('/_//::'))
      .resolves.toMatchObject({ statusCode: 404 })
  })

  it('ignores the query string', async () => {
    await expect(supertest(server).get('/_/a.com?foo=bar'))
      .resolves.toBeSupertestRedirect('https://example.com/a')
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
  const app = await createApp({
    logger: false,
    ...options
  })
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
