/* eslint-disable promise/always-return */
const { spawn } = require('node:child_process')
const { mkdir, readFile, writeFile } = require('node:fs/promises')
const { URL } = require('node:url')
const { join } = require('node:path')
const pretty = require('pretty-time')

const outdir = 'public/archive'

const catchAllFilesPath = [
  '/sites/',
  '/sfc/sites/'
]

const wgetArgs = [
  '--adjust-extension',
  '--compression', 'gzip',
  '--convert-links',
  '--directory-prefix', outdir,
  '--page-requisites',
  '--recursive',
  '--timestamping',
  '--user-agent', 'Archive-It',
  '--include-directories', catchAllFilesPath.join(',')
]

module.exports = {
  crawl,
  catchAllFilesPath,
  getRejected,
  getSavedFiles
}

async function crawl (urlish, extraArgs = []) {
  const url = new URL(urlish, 'https://sfgov.org')
  const { hostname, pathname } = url
  const logDir = join('logs', hostname, pathname)

  await mkdir(logDir, { recursive: true })
  await mkdir(outdir, { recursive: true })

  const logPath = join(logDir, 'wget.log')
  const rejectedLogPath = join(logDir, 'wget.rejected.tsv')

  const args = [
    ...wgetArgs,
    '--output-file', logPath,
    '--rejected-log', rejectedLogPath,
    '--include-directories', pathname,
    ...extraArgs,
    url
  ].map(String)

  console.log('🦀 crawling: %s (log file: %s)', url, logPath)
  // console.log('→ `wget %s`', args.map(shellQuote).join(' '))

  return new Promise((resolve, reject) => {
    const start = process.hrtime()
    const proc = spawn('wget', args, {
      detached: true
    })

    proc.on('error', error => {
      reject(new Error(`Crawl failed: \`wget ${args.map(shellQuote)}\` error: ${error.message}`))
    })

    proc.on('close', (code, signal) => {
      const elapsed = process.hrtime(start)
      console.log('✅ done crawling: %s (finished in %s)', url, seconds(elapsed))
      // console.log('🔎 gathering crawl info...')
      Promise.all([
        getSavedFiles(logPath),
        getRejected(rejectedLogPath)
      ])
        .then(async ([saved, rejected]) => {
          const actualRejected = rejected
            // .filter(item => item.REASON !== 'BLACKLIST')
            .map(entry => decodeURIComponent(entry.U_URL))
            .filter(Boolean)
            .filter(unique)
            .sort()
          const rejectedListPath = join(logDir, 'rejected.txt')
          await writeFile(rejectedListPath, actualRejected.join('\n'))
          resolve({
            url: url.toString(),
            log: logPath,
            wgetArgs: args,
            saved,
            rejected,
            rejectedListPath
          })
        })
        .catch(reject)
    })
  })
}

function shellQuote (str) {
  return str.match(/[\s"&*?]/)
    ? `'${str}'`
    : str
}

async function getRejected (logPath) {
  const data = await readFile(logPath, 'utf8')
  const lines = data.split('\n')
    .filter(Boolean)
    .map(line => line.split('\t'))
  const headers = lines.shift()
  return lines.map(row => Object.fromEntries(row.map((val, i) => [headers[i], val])))
}

async function getSavedFiles (logPath) {
  const data = await readFile(logPath, 'utf8')
  const urls = []
  const paths = []
  data.replace(/--\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}--\s+(\S+)\n/, (_, url) => {
    urls.push(url)
  })
  data.replace(/Saving to: ‘([^’]+)’/g, (_, path) => {
    paths.push(path)
  })
  return {
    urls,
    paths
  }
}

function unique (item, index, list) {
  return list.indexOf(item) === index
}

function seconds (ms) {
  return pretty(ms, 's')
}
