import {
  Matcher,
  loadMatcher,
  URLMatcher
} from './redirect'

const files: { [path: string]: string } = {
  'fixture.yml': `
redirect:
  hosts:
    sfgov.org:
      paths:
        /sfds: 'https://ds.sf.gov/'
  `
}

jest.mock('fs', () => ({
  readFileSync: jest.fn((path:string) => {
    return files[path]
  })
}))

describe('URLMatcher', () => {
  describe('host with no protocol', () => {
    const matcher = new URLMatcher('sfgov.org', '', 'https://sf.gov/')
    describe('.match()', () => {
      it('can match hosts without protocol', () => {
        expect(matcher.match('sfgov.org')).toBe(true)
        expect(matcher.match('sfgov.org/')).toBe(true)
      })
      it('can match fully-formed URLs', () => {
        expect(matcher.match('https://sfgov.org')).toBe(true)
        expect(matcher.match('https://sfgov.org/')).toBe(true)
      })
    })
  })

  describe('host with protocol', () => {
    const matcher = new URLMatcher('https://sfgov.org', '', 'https://sf.gov/')
    describe('.match()', () => {
      it('does not match hosts without protocol', () => {
        expect(matcher.match('sfgov.org')).toBe(false)
      })
      it('does not match hosts mismatched protocol', () => {
        expect(matcher.match('http://sfgov.org')).toBe(false)
      })
      it('can match fully-formed URLs', () => {
        expect(matcher.match('https://sfgov.org')).toBe(true)
        expect(matcher.match('https://sfgov.org/')).toBe(true)
      })
    })
  })

  describe('"(www.)hostname" matching', () => {
    const matcher = new URLMatcher('(www.)sfgov.org', '', 'https://sf.gov')
    describe('.match()', () => {
      it('matches the hostname without the www. prefix', () => {
        expect(matcher.match('sfgov.org')).toBe(true)
        expect(matcher.match('sfgov.org/')).toBe(true)
      })
      it('matches the hostname without the www. prefix and protocol(s)', () => {
        expect(matcher.match('http://sfgov.org')).toBe(true)
        expect(matcher.match('http://sfgov.org/')).toBe(true)
        expect(matcher.match('https://sfgov.org')).toBe(true)
        expect(matcher.match('https://sfgov.org/')).toBe(true)
      })
      it('matches the hostname with the www. prefix', () => {
        expect(matcher.match('www.sfgov.org')).toBe(true)
        expect(matcher.match('www.sfgov.org/')).toBe(true)
      })
      it('matches the hostname with the www. prefix and protocol(s)', () => {
        expect(matcher.match('http://www.sfgov.org')).toBe(true)
        expect(matcher.match('http://www.sfgov.org/')).toBe(true)
        expect(matcher.match('https://www.sfgov.org')).toBe(true)
        expect(matcher.match('https://www.sfgov.org/')).toBe(true)
      })
    })
  })
})

describe('loadMatcher()', () => {
  it('loads a file', () => {
    const matcher: Matcher = loadMatcher('fixture.yml')
    expect(matcher.match('sfgov.org/sfds')).toBe(true)
    expect(matcher.resolve('sfgov.org/sfds')).toBe('https://ds.sf.gov/')
    expect(matcher.match('https://archive.sf.gov/')).toBe(false)
  })
})
