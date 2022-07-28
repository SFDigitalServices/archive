const { Site, loadSite, loadSites } = require('../src/sites')

describe('loadSite()', () => {
  it('works', async () => {
    const site = await loadSite('__tests__/__fixtures__/basic-site.yml')
    expect(site).toMatchSnapshot()
  })
})

describe('loadSites()', () => {
  it('works', async () => {
    const sites = await loadSites('__tests__/__fixtures__/*.yml')
    expect(sites).toMatchSnapshot()
  })
})

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
})
