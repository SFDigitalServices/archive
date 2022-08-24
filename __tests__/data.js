/* eslint-disable no-template-curly-in-string */
const { YAMLException } = require('js-yaml')
const { getHostnames, loadRedirects, readYAML } = require('../src/data')

describe('getHostnames()', () => {
  it('filters out dupes', () => {
    expect(getHostnames('example.com', 'example.com')).toEqual(['example.com'])
  })

  it('maps leading "." to "*."', () => {
    expect(getHostnames('.example.com')).toEqual(['*.example.com'])
  })

  it('interpolates env vars', () => {
    // FIXME: mock process.env here
    process.env.TEST_HOSTNAMES_ENV_VAR = 'wut'
    expect(getHostnames('${TEST_HOSTNAMES_ENV_VAR}.example.com')).toEqual(['wut.example.com'])
    delete process.env.TEST_HOSTNAMES_ENV_VAR
  })

  it('removes entries with empty leading interpolations', () => {
    expect(getHostnames('${derp}.example.com')).toEqual([])
  })
})

describe.skip('getInlineRedirects()', () => {
  // TODO
})

describe('readYAML()', () => {
  it('works', () => {
    expect(readYAML('__tests__/__fixtures__/basic-site.yml')).resolves.toMatchObject({
      base_url: 'https://sfgov.org/old-url'
    })
  })

  it('throws YAML parse errors', () => {
    expect(readYAML('__tests__/__fixtures__/invalid-site.yml')).rejects.toThrow(YAMLException)
  })

  it('throws if the path does not exist', () => {
    expect(readYAML('nope/nope/nopity/nope.yml')).rejects.toThrow(/ENOENT/)
  })
})

describe('loadRedirects()', () => {
  const targetPath = '/home'
  const expectedUrl = 'https://example.com/'

  it('throws on falsy sources', async () => {
    expect(loadRedirects(null)).rejects.toThrow(/Expected array/)
    expect(loadRedirects({})).rejects.toThrow(/Expected array/)
  })

  it('defaults relativePath to "."', async () => {
    const redirects = await loadRedirects([{
      file: '__tests__/__fixtures__/basic-redirects.tsv'
    }])
    expect(redirects).toBeInstanceOf(Map)
    expect(redirects.get(targetPath)).toEqual(expectedUrl)
  })

  it('does not use the relativePath if falsy', async () => {
    const redirects = await loadRedirects([{
      file: '__tests__/__fixtures__/basic-redirects.tsv'
    }], null)
    expect(redirects).toBeInstanceOf(Map)
    expect(redirects.get(targetPath)).toEqual(expectedUrl)
  })

  it('respects the relative path', async () => {
    const redirects = await loadRedirects([{
      file: '__fixtures__/basic-redirects.tsv'
    }], '__tests__')
    expect(redirects).toBeInstanceOf(Map)
    expect(redirects.get(targetPath)).toEqual(expectedUrl)
  })

  describe('trailing-slash option', () => {
    it('adds slashes', async () => {
      const redirects = await loadRedirects([{
        file: '__tests__/__fixtures__/basic-redirects.tsv',
        'trailing-slash': true
      }])
      expect(redirects.get(targetPath)).toEqual(expectedUrl)
      expect(redirects.get(`${targetPath}/`)).toEqual(expectedUrl)
    })
  })
})
