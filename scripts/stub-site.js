#!/usr/bin/env node
/* eslint-disable promise/always-return */
const globby = require('globby')
const yargs = require('yargs')
const { join } = require('node:path')
const { readFileSync, writeFileSync, mkdirSync } = require('node:fs')

const templateDir = 'templates/site-config'

globby('**', { cwd: templateDir }).then(templateFiles => {
  const $0 = __filename.replace(`${process.cwd()}/`, '')
  const builder = yargs
    .usage(`
      ${$0} <domain> [<collection-id>] [options]`)
    .option('slug', {
      desc: 'The site "slug", which must be unique and should be the same as the domain'
    })
    .option('name', {
      desc: 'The human-readable site name'
    })
    .option('url', {
      desc: 'The fully-qualified URL that https://{domain}/ redirects to, typically on sf.gov'
    })
    .option('collection', {
      desc: 'The Archive-It numeric collection id'
    })

  const { _: [domain], name, url, slug, collection } = builder.argv
  if (!domain) {
    return builder.showHelp()
  }
  const config = {
    site_name: name || domain,
    domain,
    slug: slug || domain.split('.').slice(0, -1).join('.'),
    collection_id: collection || 'org-571',
    url: url || 'https://sf.gov'
  }
  const outputDir = join('config/sites', config.slug)
  console.log('new site:', config)
  console.log('+ dir', outputDir)
  mkdirSync(outputDir, { recursive: true })

  const expandFilePath = path => path.replace('{slug}', config.slug)

  for (const templateFile of templateFiles) {
    const inputFile = join(templateDir, templateFile)
    const outputFile = join(outputDir, expandFilePath(templateFile))
    console.log('+ file', outputFile)
    const input = readFileSync(inputFile, 'utf8')
    const output = input.replace(/{{\s*(\w+)\s*}}/g, (part, key) => {
      const value = config[key]
      if (!value) {
        throw new Error(`Empty template variable "${key}" found in ${inputFile}`)
      }
      return value
    })
    writeFileSync(outputFile, output)
  }
})
  .catch(error => {
    console.error(error)
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  })
