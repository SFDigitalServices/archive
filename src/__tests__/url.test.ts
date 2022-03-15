/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Request } from 'express'
import {
  getRawQueryString,
  getActualRequestUrl,
  getHttpsUrl,
} from '../url'

describe('getRawQueryString()', () => {
  it('works', () => {
    expect(getRawQueryString('https://foo.com')).toBe(undefined)
    expect(getRawQueryString('not-a-url')).toBe(undefined)
    expect(getRawQueryString('https://example.com/foo?bar=baz')).toBe('bar=baz')
    expect(getRawQueryString('https://example.com/foo?bar=baz?qux')).toBe('bar=baz?qux')
  })

  it('handles errors', () => {
    expect(getRawQueryString(undefined)).toBe(undefined)
  })
})

describe('getActualRequestUrl()', () => {
  it('works', () => {
    expect(getActualRequestUrl({
      protocol: 'http',
      hostname: 'example.com',
      originalUrl: '/wut'
    })).toBe('http://example.com/wut')
  })

  it('handles missing originalUrl', () => {
    expect(getActualRequestUrl({
      protocol: 'http',
      hostname: 'example.com',
      originalUrl: undefined
    })).toBe('http://example.com')
  })

  it('throws if it gets no protocol', () => {
    expect(() => getActualRequestUrl({
      url: 'example.com'
    })).toThrow('Request has no protocol: "example.com"')
  })

  it('throws if it gets no hostname', () => {
    expect(() => getActualRequestUrl({
      protocol: 'ftp',
      url: 'ftp://wut'
    })).toThrow('Request has no hostname: "ftp://wut"')
  })
})

describe('getHttpsUrl()', () => {
  it('works', () => {
    expect(getHttpsUrl('http://example.com')).toBe('https://example.com')
  })

  it('handles non-strings gracefully', () => {
    expect(getHttpsUrl(undefined)).toBe(undefined)
  })
})
