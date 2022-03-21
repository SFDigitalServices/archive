/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
import app from './app'
import supertest, { Response } from 'supertest'

const request = supertest(app)

describe('app', () => {
  it('serves HTML from /', () => {
    return request.get('/')
      .expect(200)
      .expect('Content-type', /text\/html/)
      .then((res: Response): void => {
        expect(res.ok).toBe(true)
      })
  })
})

// eslint-disable-next-line jest/no-commented-out-tests
/*
describe('redirects', () => {
  it('sftreasureisland.org (all URL variations)', () => {
    const redirectUrl = 'https://sf.gov/departments/city-administrator/treasure-island-development-authority'
    expect(app).toRedirect('sftreasureisland.org', redirectUrl)
    expect(app).toRedirect('www.sftreasureisland.org', redirectUrl)
    expect(app).toRedirect('http://sftreasureisland.org', redirectUrl)
    expect(app).toRedirect('http://sftreasureisland.org/', redirectUrl)
  })

  it('sfgov.org/non-existent-url', () => {
    expect(app).not.toRedirect('sftreasureisland.com', undefined)
  })
})
*/
