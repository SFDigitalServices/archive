/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Request } from 'express'
import fetch, { Response } from 'node-fetch'
import {
  getArchived,
  getAvailable,
  getRequestUrl
} from '../archive'

const actualFetch = jest.requireActual('node-fetch')
jest.mock('node-fetch')
const fetchMock = fetch as jest.MockedFunction<typeof fetch>
beforeEach(() => {
  fetchMock.mockImplementation(actualFetch as (typeof fetch))
})

describe('getRequestUrl()', () => {
  it('works', () => {
    expect(getRequestUrl({
      protocol: 'https',
      hostname: 'example.com',
      originalUrl: '/foo'
    })).toBe('https://example.com/foo')
  })

  it('respects the "url" request param', () => {
    expect(getRequestUrl({
      protocol: 'https',
      hostname: 'example.com',
      originalUrl: '/foo',
      params: {
        url: 'https://sf.gov'
      }
    })).toBe('https://sf.gov')
  })

  it('respects the "url" query parameter', () => {
    expect(getRequestUrl({
      protocol: 'https',
      hostname: 'example.com',
      originalUrl: '/foo',
      query: {
        url: 'https://sf.gov'
      }
    })).toBe('https://sf.gov')
  })

  it('respects raw query string', () => {
    expect(getRequestUrl({
      protocol: 'http',
      hostname: 'example.com',
      originalUrl: '/?https://foo.com/wut'
    } as Request)).toBe('https://foo.com/wut')
  })

  it('falls back to the full request URL', () => {
    expect(getRequestUrl({
      protocol: 'http',
      hostname: 'example.com',
      originalUrl: '/wut'
    })).toBe('http://example.com/wut')
  })
})

describe('archive APIs', () => {
  describe('getAvailable()', () => {
    it('works', async () => {
      const url = 'https://sf.gov'
      await expect(getAvailable(url)).resolves.toEqual({
        url,
        archived_snapshots: {
          closest: expectedSnapshotData(url)
        }
      })
    })

    describe('error handling', () => {
      it('handles errors gracefully', async () => {
        fetchMock.mockImplementationOnce(() => Promise.resolve({
          json (): never {
            throw new Error('yikes')
          }
        } as unknown as Response))
        await expect(getAvailable('https://sf.gov')).resolves.toEqual(undefined)
      })

      it('handles other things', async () => {
        fetchMock.mockImplementationOnce(() => Promise.resolve({
          json (): never {
            throw 'yikes' // eslint-disable-line
          }
        } as unknown as Response))
        await expect(getAvailable('https://sf.gov')).resolves.toEqual(undefined)
      })
    })
  })

  describe('getArchived()', () => {
    it('works', async () => {
      const url = 'https://sf.gov'
      await expect(getArchived(url)).resolves.toEqual(
        expectedSnapshotData(url)
      )
    })

    it('returns undefined when getAvailable() fails', async () => {
      fetchMock.mockImplementationOnce(() => Promise.resolve({
        json (): never {
          throw new Error('yikes')
        }
      } as unknown as Response))

      await expect(getArchived('https://sf.gov')).resolves.toEqual(undefined)
    })
  })
})

function expectedSnapshotData (url: string, timestamp: string = undefined): object {
  const expectedArchiveUrl = url.replace(/^https?:/, ':')
  return {
    status: '200',
    available: true,
    url: expect.stringContaining(expectedArchiveUrl),
    timestamp: timestamp || expect.any(String)
  }
}
