/* eslint-disable promise/always-return */
const { Site } = require('../src/sites')
const express = require('express')
const supertest = require('supertest')
const { REDIRECT_PERMANENT, ARCHIVE_BASE_URL } = require('../src/constants')

describe('Site', () => {
  describe('base URL', () => {
    it('works with base_url', () => {
      const site = new Site({
        base_url: 'https://example.com'
      })
      expect(String(site.baseUrl)).toBe('https://example.com/')
    })
    it('works with archive.base_url', () => {
      const site = new Site({
        archive: {
          base_url: 'https://example.com'
        }
      })
      expect(String(site.baseUrl)).toBe('https://example.com/')
    })
  })

  describe('hostnames', () => {
    const site = new Site({
      base_url: 'https://example.com',
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
  })

  describe('matchesHost()', () => {
    describe('simple case', () => {
      const site = new Site({
        base_url: 'https://example.com',
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
        base_url: 'https://example.com',
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
        base_url: 'https://example.com',
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

    it('loads redirect maps from files', async () => {
      const site = new Site({
        path: '.',
        base_url: 'https://example.com',
        redirects: [
          { file: '__tests__/__fixtures__/basic-redirects.tsv' }
        ]
      })
      await site.loadRedirects()
      expect(site.resolve('/home')).toEqual('https://example.com/')
    })

    it('resolves internal redirects', () => {
      const site = new Site({
        base_url: 'https://example.com',
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
  })
})
