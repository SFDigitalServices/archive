/* eslint-disable promise/always-return */
const { Site, loadRedirects } = require('../src/sites')
const { readFileSync } = require('node:fs')
const express = require('express')
const supertest = require('supertest')
const { YAMLException } = require('js-yaml')
const { REDIRECT_PERMANENT, ARCHIVE_BASE_URL } = require('../src/constants')

const EXAMPLE_BASE_URL = 'https://example.com'
const EXAMPLE_BASE_URL_SLASH = `${EXAMPLE_BASE_URL}/`

describe('Site', () => {
  describe('name', () => {
    it('names sites appropriately', () => {
      expect(new Site({
        base_url: EXAMPLE_BASE_URL,
        name: 'foo'
      }).name).toBe('"foo"')
      expect(new Site({
        base_url: EXAMPLE_BASE_URL
      }).name).toBe('<example.com>')
    })
  })
  describe('base URL', () => {
    it('works with base_url', () => {
      const site = new Site({
        base_url: EXAMPLE_BASE_URL
      })
      expect(String(site.baseUrl)).toBe(EXAMPLE_BASE_URL_SLASH)
    })
    it('works with archive.base_url', () => {
      const site = new Site({
        archive: {
          base_url: EXAMPLE_BASE_URL
        }
      })
      expect(String(site.baseUrl)).toBe(EXAMPLE_BASE_URL_SLASH)
    })
  })

  describe('hostnames', () => {
    const site = new Site({
      base_url: EXAMPLE_BASE_URL,
      hostnames: [
        'www.example.com'
      ]
    })

    it('has a valid .hostname', () => {
      expect(site.hostname).toEqual('example.com')
    })

    it('has expected .hostnames[]', () => {
      expect(site.hostnames).toEqual([
        'example.com',
        'www.example.com'
      ])
    })

    it('replaces a leading "." with "*."', () => {
      expect(new Site({
        base_url: EXAMPLE_BASE_URL,
        hostnames: ['.example.com']
      }).hostnames).toEqual([
        'example.com',
        '*.example.com'
      ])
    })
  })

  describe('matchesHost()', () => {
    describe('simple case', () => {
      const site = new Site({
        base_url: EXAMPLE_BASE_URL,
        hostnames: [
          'www.example.com'
        ]
      })
      it('matches valid hostnames', () => {
        expect(site.matchesHost('example.com')).toBe(true)
        expect(site.matchesHost('www.example.com')).toBe(true)
      })
      it('does not match invalid hostnames', () => {
        expect(site.matchesHost('smtp.example.com')).toBe(false)
        expect(site.matchesHost('www.www.example.com')).toBe(false)
      })
    })

    describe('wildcards', () => {
      const site = new Site({
        base_url: EXAMPLE_BASE_URL,
        hostnames: [
          '*.example.com'
        ]
      })
      it('matches valid hostnames', () => {
        expect(site.matchesHost('example.com')).toBe(true)
        expect(site.matchesHost('www.example.com')).toBe(true)
        expect(site.matchesHost('smtp.example.com')).toBe(true)
        expect(site.matchesHost('www.www.example.com')).toBe(true)
      })
      it('does not match invalid hostnames', () => {
        expect(site.matchesHost('wwwexample.com')).toBe(false)
      })
    })
  })

  describe('redirects', () => {
    it('gets inline redirects', () => {
      const site = new Site({
        base_url: EXAMPLE_BASE_URL,
        redirects: [
          {
            map: {
              '/wut': 'https://www.example.com/home'
            }
          }
        ]
      })
      expect(site.resolve('/wut')).toEqual('https://www.example.com/home')
    })

    it('loads redirect maps relative to the path', async () => {
      const site = new Site({
        path: '__tests__/__fixtures__/basic-site.yml',
        base_url: EXAMPLE_BASE_URL,
        redirects: [
          { file: './basic-redirects.tsv' }
        ]
      })
      await site.loadRedirects()
      expect(site.resolve('/home')).toEqual('https://example.com/')
    })

    it('loads redirect maps from files', async () => {
      const site = new Site({
        path: '.',
        base_url: EXAMPLE_BASE_URL,
        redirects: [
          { file: '__tests__/__fixtures__/basic-redirects.tsv' }
        ]
      })
      await site.loadRedirects()
      expect(site.resolve('/home')).toEqual('https://example.com/')
    })

    it('ignores empty/non-existent redirects', async () => {
      expect(new Site({
        base_url: EXAMPLE_BASE_URL
      }).loadRedirects()).resolves.toBeInstanceOf(Map)
      expect(new Site({
        base_url: EXAMPLE_BASE_URL,
        redirects: []
      }).loadRedirects()).resolves.toBeInstanceOf(Map)
    })

    it('resolves internal redirects', () => {
      const site = new Site({
        base_url: EXAMPLE_BASE_URL,
        redirects: [
          {
            map: {
              '/about-us': '/about',
              '/about': 'https://some-other-site.com/about'
            }
          }
        ]
      })
      expect(site.resolve('/about-us')).toEqual('https://some-other-site.com/about')
    })
  })

  describe('archive URLs', () => {
    it('uses "org-571" as the collection ID if none is provided', () => {
      expect(new Site({ base_url: EXAMPLE_BASE_URL }).getArchiveUrl()).toContain('/org-571/')
    })
  })

  describe('site router', () => {
    describe('whole-domain sites', () => {
      const site = new Site({
        base_url: 'https://sftreasureisland.org',
        redirects: [
          {
            map: {
              '/': 'https://sf.gov/departments/city-administrator/treasure-island-development-authority'
            }
          }
        ],
        archive: {
          collection_id: 18901
        }
      })

      const router = site.createRouter()
      const app = express().use(router)

      it('routes only for the defined hostnames', async () => {
        await supertest(app)
          .get('/bac/')
          .set('host', 'sfgov.org')
          .expect(404)
        await supertest(app)
          .get('/')
          .set('host', 'sftreasureisland.org')
          .expect(REDIRECT_PERMANENT)
          .expect('location', site.redirects.get('/'))
      })

      it('redirects to the wayback machine', async () => {
        await supertest(app)
          .get('/derp')
          .set('host', 'sftreasureisland.org')
          .expect(REDIRECT_PERMANENT)
          .expect('location', `${ARCHIVE_BASE_URL}/${site.collectionId}/3/https://${site.baseUrl.hostname}/derp`)
      })

      it.skip('404s on un-archive-able URLs', async () => {
        // TODO: flesh this out if/when Site.prototype.getArchiveUrl()
        // ever returns undefined
      })
    })

    describe('sites on a path of sfgov.org', () => {
      const siteA = new Site({
        base_url: 'https://sfgov.org/a/',
        archive: {
          collection_id: 123
        },
        redirects: [
          { map: { '/': 'https://sf.gov/site-a/' } }
        ]
      })
      const siteB = new Site({
        base_url: 'https://sfgov.org/b/',
        archive: {
          collection_id: 456
        },
        redirects: [
          { map: { '/': 'https://sf.gov/site-b/' } }
        ]
      })
      const app = express()
        .use(siteA.createRouter())
        .use(siteB.createRouter())

      it('routes to the first site', async () => {
        await supertest(app)
          .get('/a/')
          .set('host', 'sfgov.org')
          .then(res => {
            expect(res.statusCode).toBe(REDIRECT_PERMANENT)
            expect(res.get('location')).toBe(siteA.redirects.get('/'))
          })
        await supertest(app)
          .get('/a/derp')
          .set('host', 'sfgov.org')
          .then(res => {
            expect(res.statusCode).toBe(REDIRECT_PERMANENT)
            expect(res.get('location')).toBe(`${ARCHIVE_BASE_URL}/${siteA.collectionId}/3/${siteA.baseUrl}derp`)
          })
      })

      it('routes to the second site', async () => {
        await supertest(app)
          .get('/b/')
          .set('host', 'sfgov.org')
          .then(res => {
            expect(res.statusCode).toBe(REDIRECT_PERMANENT)
            expect(res.get('location')).toBe(siteB.redirects.get('/'))
          })
        await supertest(app)
          .get('/b/derp')
          .set('host', 'sfgov.org')
          .then(res => {
            expect(res.statusCode).toBe(REDIRECT_PERMANENT)
            expect(res.get('location')).toBe(`${ARCHIVE_BASE_URL}/${siteB.collectionId}/3/${siteB.baseUrl}derp`)
          })
      })

      it('404s on other URLs', async () => {
        await supertest(app)
          .get('/')
          .expect(404)
        await supertest(app)
          .get('/c/')
          .expect(404)
      })
    })

    describe('static routing', () => {
      describe('createStaticRouter()', () => {
        it('returns a router when there is a static config', async () => {
          const site = new Site({
            base_url: EXAMPLE_BASE_URL,
            static: {
              path: '__tests__/__fixtures__/static-files'
            }
          })
          const router = site.createStaticRouter()
          expect(router).toBeInstanceOf(Function)
          const app = express().use(router)
          await supertest(app)
            .get('/robots.txt')
            .expect(
              readFileSync('__tests__/__fixtures__/static-files/robots.txt', 'utf8')
            )
        })

        it('does not return a router if there is no static config', () => {
          const site = new Site({ base_url: EXAMPLE_BASE_URL })
          expect(site.createStaticRouter()).toBe(undefined)
        })
      })

      describe('static routing from createRouter()', () => {
        it('mounts the static router', async () => {
          const site = new Site({
            base_url: EXAMPLE_BASE_URL,
            static: {
              path: '__tests__/__fixtures__/static-files'
            }
          })
          const router = site.createRouter()
          const app = express().use(router)
          // FIXME: not sure why this isn't working :(
          await supertest(app)
            .get('/robots.txt')
            .set('host', 'example.com')
            .expect(200)
            .expect(readFileSync('__tests__/__fixtures__/static-files/robots.txt', 'utf8'))
        })
      })
    })
  })

  describe('Site.load()', () => {
    it('loads a site asynchronously', async () => {
      const site = await Site.load('__tests__/__fixtures__/basic-site.yml')
      expect(site).toBeInstanceOf(Site)
      expect(site.path).toBe('__tests__/__fixtures__/basic-site.yml')
    })

    it('throws if the file is not found', async () => {
      await expect(Site.load('wtf/yo.yml')).rejects.toThrow(/ENOENT/)
    })

    it('throws if the file does not parse', async () => {
      expect(Site.load('__tests__/__fixtures__/invalid-site.yml')).rejects.toBeInstanceOf(YAMLException)
    })
  })

  describe('Site.loadAll()', () => {
    it('loads a site asynchronously', async () => {
      const sites = await Site.loadAll('__tests__/__fixtures__/basic-*.yml')
      expect(sites).toHaveLength(1)
      expect(sites[0].path).toBe('__tests__/__fixtures__/basic-site.yml')
    })

    it('does not throw if the glob misses', async () => {
      expect(Site.loadAll('__tests__/__fixtures__/missing-*.yml')).resolves.toEqual([])
    })

    it('throws if the file does not parse', async () => {
      expect(Site.loadAll('__tests__/__fixtures__/invalid-*.yml')).rejects.toBeInstanceOf(YAMLException)
    })
  })
})

describe('loadRedirects()', () => {
  it('throws on falsy sources', async () => {
    expect(loadRedirects(null)).rejects.toThrow(/Expected array/)
    expect(loadRedirects({})).rejects.toThrow(/Expected array/)
  })

  it('defaults relativePath to "."', async () => {
    const redirects = await loadRedirects([{
      file: '__tests__/__fixtures__/basic-redirects.tsv'
    }])
    expect(redirects).toBeInstanceOf(Map)
    expect(redirects.get('/home')).toEqual('https://example.com/')
  })

  it('does not use the relativePath if falsy', async () => {
    const redirects = await loadRedirects([{
      file: '__tests__/__fixtures__/basic-redirects.tsv'
    }], null)
    expect(redirects).toBeInstanceOf(Map)
    expect(redirects.get('/home')).toEqual('https://example.com/')
  })

  it('respects the relative path', async () => {
    const redirects = await loadRedirects([{
      file: '__fixtures__/basic-redirects.tsv'
    }], '__tests__')
    expect(redirects).toBeInstanceOf(Map)
    expect(redirects.get('/home')).toEqual('https://example.com/')
  })
})
