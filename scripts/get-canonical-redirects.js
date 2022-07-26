#!/usr/bin/env node
/* eslint-disable promise/always-return, promise/catch-or-return */
const fetch = require('node-fetch')
const { createWriteStream } = require('node:fs')
const { dirname } = require('node:path')
const { loadSite, loadRedirects } = require('../src/sites')

const args = require('yargs')
  .argv

const [filename, output = '/dev/stdout'] = args._

loadSite(filename)
  .then(async site => {
    const redirects = await loadRedirects(site.redirects || [], dirname(site.path))
    const baseUrl = site.archive.base_url
    console.warn('checking %d redirects...', redirects.size)
    const seen = new Set()
    const stream = createWriteStream(output, 'utf8')
    for (const [from, to] of redirects.entries()) {
      const canonical = await getCanonicalUrl(new URL(from, baseUrl))
      const url = canonical ? new URL(canonical) : undefined
      if (!canonical) {
        continue
      } else if (url?.pathname === from) {
        // from is canonical
      } else if (canonical === to) {
        // from is canonical
      } else if (!redirects.has(url.pathname)) {
        stream.write(`${url.pathname}\t${to}\n`)
        seen.add(url.pathname)
      }
      seen.add(from)
    }
    stream.end()
  })

async function getCanonicalUrl (url) {
  const res = await fetch(url, {
    redirect: 'manual',
    headers: {
      'user-agent': 'Archive-It'
    }
  })
  return res.headers.get('location')
}
