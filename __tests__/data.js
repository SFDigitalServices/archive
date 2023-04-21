const { YAMLException } = require('js-yaml')
const { loadRedirects, readYAML } = require('../src/data')

describe.skip('getHostnames()', () => {
  // TODO
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

  describe('ASCII encoding', () => {
    it('adds ASCII encodings for UTF redirect paths', async () => {
      const redirects = await loadRedirects([{
        file: '__tests__/__fixtures__/redirects-with-unicode.tsv',
        'includes-unicode': true
      }])
      expect(redirects.get('/選舉投票')).toEqual('https://sf.gov/zh-hant/ways-vote')
      expect(redirects.get('/¡buscamos-su-participación-en-nuestro-plan-de-difusión')).toEqual('https://sf.gov/departments/department-elections')
    })
  })
})
