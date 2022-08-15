
const express = require('express')
const supertest = require('supertest')
const createApp = require('../src/app')
const { Site } = require('../src/sites')

require('../lib/test-setup')

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

describe('app options', () => {
  /**
   * NB: the HTTP method filter sends a 405 (Method Not Allowed) status,
   * and requests that fall through will return a 404 (Not Found).
   */
  const notAllowed = { status: 405 }
  const allowedNotFound = { status: 404 }
  describe('allowedMethods', () => {
    it('defaults to GET, HEAD, and OPTIONS', async () => {
      const allowedMethods = ['GET', 'HEAD', 'OPTIONS']
      const server = await createServer({ sites: [] })
      for (const method of allowedMethods) {
        await expect(testRequest(server, '/', method))
          .resolves.toMatchObject(allowedNotFound)
      }
    })

    it('rejects other verbs', async () => {
      const notAllowedMethods = [
        'DELETE',
        'PATCH',
        'POST',
        'PUT',
        'TRACE'
      ]
      const server = await createServer({ sites: [] })
      for (const method of notAllowedMethods) {
        await expect(testRequest(server, '/', method))
          .resolves.toMatchObject(notAllowed)
      }
    })

    it('disables the method filter if allowedMethods is falsy', async () => {
      for (const allowedMethods of [
        null,
        undefined,
        false,
        []
      ]) {
        const server = await createServer({ sites: [], allowedMethods })
        expect(testRequest(server, '/', 'GET'))
          .resolves.toMatchObject(allowedNotFound)
      }
    })

    it('respects the allowedMethods option if provided', async () => {
      const allowedMethods = ['GET', 'POST']
      const notAllowedMethods = ['HEAD', 'PUT']
      const server = await createServer({
        sites: [],
        allowedMethods
      })
      for (const method of allowedMethods) {
        await expect(testRequest(server, '/', method))
          .resolves.toMatchObject(allowedNotFound)
      }
      for (const method of notAllowedMethods) {
        await expect(testRequest(server, '/', method))
          .resolves.toMatchObject(notAllowed)
      }
    })
  })
})

/**
 * @param {import('..').AppOptions} options
 * @returns {Promise<express.Application>}
 */
async function createServer (options) {
  const app = await createApp(options)
  return express().use(app)
}

/**
 * @param {express.Application} app
 * @param {string} url
 * @param {string} method
 * @returns {Promise<supertest.Response>}
 */
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
