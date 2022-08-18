#!/usr/bin/env node
/* eslint-disable promise/always-return, promise/catch-or-return */
const fetch = require('node-fetch')
const { createWriteStream } = require('node:fs')
const { Site } = require('../src/sites')

const args = require('yargs').argv

const [filename, output = '/dev/stdout'] = args._

Site.load(filename)
  .then(async site => {
    const { redirects, baseUrl } = site
    console.warn('checking %d redirects...', redirects.size)

    const seen = new Set()
    const stream = createWriteStream(output, 'utf8')
    for (const [from, to] of redirects.entries()) {
      const canonical = await getCanonicalUrl(new URL(from, baseUrl))
      if (!canonical) {
        continue
      } else if (canonical.hostname === baseUrl.hostname) {
        // this is a "local" redirect
        throw new Error('oops')
      }

      if (canonical.pathname === from) {
        // from is canonical
      } else if (String(canonical) === to) {
        // from is canonical
      } else if (!redirects.has(canonical.pathname)) {
        stream.write(`${canonical.pathname}\t${to}\n`)
        seen.add(canonical.pathname)
      }
      seen.add(from)
    }
    stream.end()
  })

async function getCanonicalUrl (url) {
  const res = await fetch(url, {
    redirect: 'manual',
    headers: {
      // this header disables sf.gov redirects
      'user-agent': 'Archive-It'
    }
  })
  const location = res.headers.get('location')
  return location ? new URL(location) : undefined
}
