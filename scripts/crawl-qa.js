#!/usr/bin/env node
/* eslint-disable promise/always-return, promise/catch-or-return, promise/no-nesting */
const { readFileSync } = require('fs')
const fetch = require('node-fetch')
const { default: PQueue } = require('p-queue')
const { URL } = require('url')
const {
  ARCHIVE_COLLECTION_ID
} = process.env

const argv = require('yargs')
  .usage('$0 [options] <url> [<url>...]')
  .option('collection', {
    alias: 'c',
    default: ARCHIVE_COLLECTION_ID,
    describe: 'Archive-it collection ID (defaults to $ARCHIVE_COLLECTION_ID)'
  })
  .option('urls-from', {
    alias: 'f',
    type: 'string',
    array: true,
    coerce (filename) {
      if (Array.isArray(filename)) {
        return filename.flatMap(readLines)
      } else if (filename) {
        return readLines(filename)
      }
      return undefined
    }
  })
  .option('concurrency', {
    alias: 'n',
    type: 'number',
    describe: 'Maximum archive URL fetching concurrency',
    default: 5
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    describe: 'Output extra debugging info'
  })
  .demandOption('collection')
  .argv

const {
  url: matchUrl,
  urlsFrom,
  collection = ARCHIVE_COLLECTION_ID,
  concurrency,
  verbose,
  _: urls // eslint-disable-line no-unused-vars
} = argv

const url = new URL(`https://wayback.archive-it.org/${collection}/timemap`)
const query = {
  url: matchUrl || urls[0] || 'https://sfgov.org',
  matchType: 'prefix',
  collapse: 'urlkey',
  output: 'json',
  filter: 'statuscode:[23]..',
  fl: [
    'original',
    'mimetype',
    // 'timestamp',
    // 'endtimestamp',
    // 'groupcount',
    // 'uniqcount',
    'statuscode'
  ].join(','),
  limit: 1000000,
  _: Date.now()
}

for (const [key, value] of Object.entries(query)) {
  url.searchParams.append(key, value)
}

if (verbose) console.warn('fetching: %s', url)

fetch(url, {
  headers: {
    accept: 'application/json',
    'cache-control': 'no-cache'
  }
})
  .then(res => res.json())
  .catch(error => {
    console.error('Error:', error.message)
    return []
  })
  .then(data => {
    const [header, ...rows] = data
    return rows.map(values => Object.fromEntries(
      values.map((value, i) => [header[i], value])
    ))
  })
  .then(data => {
    const isValidMimeType = mimetype => mimetype?.includes('text/html') || mimetype?.includes('/pdf')
    const subset = data.filter(d => isValidMimeType(d.mimetype))
    const pruned = data.length - subset.length
    if (pruned > 0) {
      const otherTypes = data.filter(d => !isValidMimeType(d.mimetype)).map(d => d.mimetype).filter(unique)
      console.warn('Pruned %d URLs (of %d) with other content-types:', pruned, data.length, otherTypes)
    }

    const crawled = Object.fromEntries(
      subset.map(({ original: url, ...rest }) => [url, { url, archiveUrl: getArchivedUrl(url), ...rest }])
    )
    const queue = new PQueue({ concurrency })
    if (urlsFrom) {
      for (const url of urlsFrom) {
        if (!crawled[url]) {
          queue.add(() => {
            const archiveUrl = getArchivedUrl(url)
            if (verbose) console.warn('fetching archived URL: %s (%s)', url, archiveUrl)
            return fetch(archiveUrl)
              .then(res => {
                crawled[url] = {
                  url,
                  archiveUrl,
                  mimetype: res.headers.get('content-type'),
                  statuscode: res.status
                }
              })
              .catch(error => {
                crawled[url] = {
                  archiveUrl,
                  error: error.message
                }
              })
          })
        }
      }
    }
    console.warn('Found %d URLs crawled', Object.keys(crawled).length)
    if (queue.size > 0) {
      console.warn('Fetching %d URLs by brute force...', queue.size)
    }
    return queue.start().onIdle().then(() => crawled)
  })
  .then(results => {
    const columns = [
      { in: 'url', out: 'url' },
      { in: 'statuscode', out: 'status' },
      { in: 'archiveUrl', out: 'archive URL' },
      { in: 'mimetype', out: 'content-type' },
      { in: 'error', out: 'error' }
    ]
    const delimiter = '\t'
    console.log(columns.map(col => col.out).join(delimiter))
    for (const result of Object.values(results)) {
      console.log(columns.map(col => result[col.in] || '').join(delimiter))
    }
  })

function getArchivedUrl (url) {
  return `https://wayback.archive-it.org/${collection}/3/${url}`
}

function readLines (filename) {
  return readFileSync(filename, 'utf8')
    .split(/[\r\n]+/)
    .filter(Boolean)
    .map(line => line.trim())
}

function unique (d, index, list) {
  return list.indexOf(d) === index
}
