const { createAPIRouter } = require('../src/api')
const express = require('express')
const supertest = require('supertest')
const { Site } = require('../src/sites')

describe('API', () => {
  describe('createAPIRouter()', () => {
    const site = new Site({
      base_url: 'https://example.com',
      archive: {
        collection_id: 123
      },
      redirects: [
        {
          map: {
            '/': 'https://sf.gov/example'
          }
        }
      ]
    })
    const app = express().use(createAPIRouter({ sites: [site] }))
    it('creates a router that reponds to / with HTML', () => {
      return supertest(app)
        .get('/')
        .expect(200)
        .expect('content-type', /text\/html/)
    })

    it('creates a router that reponds to /sites with JSON', () => {
      return supertest(app)
        .get('/sites')
        .expect(200)
        .expect('content-type', /application\/json/)
        .expect(res => {
          expect(res.body).toEqual({
            status: 'success',
            data: {
              sites: [site.toJSON()]
            }
          })
        })
    })

    it('creates a router that reponds to /sites/:hostname', () => {
      return supertest(app)
        .get('/sites/example.com')
        .expect(200)
        .expect('content-type', /application\/json/)
        .expect({
          status: 'success',
          data: site.toJSON()
        })
    })

    it('creates a router that 404s on /sites/{missing}', () => {
      return supertest(app)
        .get('/sites/missing.com')
        .expect(404)
        .expect('content-type', /application\/json/)
        .expect({
          status: 'error',
          data: {
            status: 404,
            message: 'No site found with hostname "missing.com"'
          }
        })
    })
  })
})