#!/usr/bin/env node
/* eslint-disable no-process-exit */
/* eslint-disable promise/always-return */
const { Site } = require('../src/sites')
const { unique } = require('../src/utils')
const { spawnSync } = require('node:child_process')
const args = process.argv.slice(2)
const { HEROKU_APP_NAME = args[0] } = process.env

if (HEROKU_APP_NAME) {
  const appPrefix = `${HEROKU_APP_NAME}.`
  const herokuDomain = `${HEROKU_APP_NAME}.herokuapp.com`

  Site.loadAll('config/sites/**/*.yml')
    .then(sites => {
      console.info('found %d sites', sites.length)
      const domains = sites
        .flatMap(site => site.hostnames)
        .filter(host => host.includes(appPrefix) && host !== herokuDomain)
        .filter(unique)
      if (domains.length) {
        console.log('adding %d domains:', domains.length, domains.join(', '))
        for (const domain of domains) {
          heroku('domains:add', domain)
        }
        heroku('domains:wait')
      } else {
        console.warn('no domains found')
      }
    })
    .catch(error => {
      console.error('error:', error.message)
      process.exit(1)
    })
} else {
  console.warn('pass an app name or set HEROKU_APP_NAME')
}

function heroku (command, ...args) {
  const allArgs = [command, '-a', HEROKU_APP_NAME, ...args]
  console.log('[run] heroku', ...allArgs)
  return spawnSync('heroku', allArgs, { stdio: 'inherit' })
}
