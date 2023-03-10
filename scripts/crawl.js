/* eslint-disable promise/always-return */
const { crawl } = require('../lib/crawl')

const crawls = [
  crawl('https://sfgov.org/bac/', [
    '--include-directories', '/sfc/bac/'
  ]),
  crawl('https://sfgov.org/arts/', [
    // '--reject=.pdf'
  ]),
  crawl('https://sfgov.org/dosw/', [
  ])
]

Promise.all(crawls)
  .then(results => {
    // console.log('all done!', results)
    for (const { url, saved, rejected, rejectedListPath } of results) {
      console.log('crawled: %s', url)
      console.log('  + %d files saved', saved.paths.length)
      console.log('  + %d urls crawled', saved.urls.length)
      console.log('  - %d urls rejected (list: %s)', rejected.length, rejectedListPath)
    }
  })
  .catch(error => {
    console.error('Error:', error)
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  })
