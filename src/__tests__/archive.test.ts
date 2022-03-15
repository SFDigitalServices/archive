/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Request } from 'express'
import fetch, { Response } from 'node-fetch'
import { getMockReq, getMockRes } from '@jest-mock/express'
import {
  ArchivedSnapshotsData,
  archiveRedirectHandler,
  AvailableResponseData,
  getArchived,
  getAvailable,
  getRequestUrl,
  WAYBACK_AVAILABLE_API
} from '../archive'
import { URL } from 'url'
import { getUrlWithParams } from '../url'
import { MockRequest } from '@jest-mock/express/dist/src/request'

const actualFetch = jest.requireActual('node-fetch')
jest.mock('node-fetch')
const fetchMock = fetch as jest.MockedFunction<typeof fetch>
beforeEach(() => {
  fetchMock.mockClear()
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
        fetchMock.mockResolvedValueOnce(
          mockFetchError(new Error('yikes'))
        )
        await expect(getAvailable('https://sf.gov')).resolves.toEqual(undefined)
      })

      it('handles other things', async () => {
        fetchMock.mockResolvedValueOnce(
          mockFetchError('yikes')
        )
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
      fetchMock.mockResolvedValueOnce(
        mockFetchError(new Error('yikes'))
      )
      await expect(getArchived('https://sf.gov')).resolves.toEqual(undefined)
    })
  })
})

describe('archiveRedirectHandler()', () => {
  it('redirects the requested URL', async () => {
    const url = 'https://sftreasureisland.org/meetings/'
    const availableUrl = getUrlWithParams(WAYBACK_AVAILABLE_API, { url })
    const timestamp = '20500101000000'
    const archivedUrl = `https://web.archive-it.org/${timestamp}/${url}`
    fetchMock.mockResolvedValueOnce(
      mockFetchJson({
        url: archivedUrl,
        archived_snapshots: {
          closest: {
            status: '200',
            available: true,
            url: archivedUrl,
            timestamp 
          }
        }
      })
    )
    const req = getMockReqFromUrl(url)
    const { res, next } = getMockRes({ req })
    await archiveRedirectHandler(req, res, next)
    expect(fetchMock).toBeCalledTimes(1)
    expect(fetchMock).toBeCalledWith(availableUrl)
    expect(res.redirect).toBeCalledTimes(1)
    expect(res.redirect).toBeCalledWith(301, archivedUrl)
  })

  it('calls next() if no archive is available', async () => {
    const url = 'https://example.com/foo'
    const availableUrl = getUrlWithParams(WAYBACK_AVAILABLE_API, { url })
    fetchMock.mockResolvedValueOnce(
      mockFetchError(404)
    )
    const req = getMockReqFromUrl(url)
    const { res, next } = getMockRes({ req })
    await archiveRedirectHandler(req, res, next)
    expect(fetchMock).toBeCalledTimes(1)
    expect(fetchMock).toBeCalledWith(availableUrl)
    expect(next).toBeCalledTimes(1)
    expect(res.redirect).not.toBeCalled()
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

function mockFetchJson (value: any) {
  return {
    json: () => Promise.resolve(value)
  } as Response
}

function mockFetchError (error: any) {
  return {
    json: () => Promise.reject(error)
  } as Response
}

function getMockReqFromUrl (url: string, props: object = {}): Request {
  const { host, hostname, pathname, protocol, search } = new URL(url)
  return getMockReq({
    url,
    protocol: protocol.replace(':', ''),
    host,
    hostname,
    path: pathname,
    originalUrl: `${pathname}${search}`,
    ...props
  })
}