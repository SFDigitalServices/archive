#!/usr/bin/env node
/* eslint-disable node/no-unpublished-import */
import { execa } from 'execa'
import { streamWrite, readableToString, streamEnd, onExit } from '@rauschma/stringio'
import { unserialize } from 'php-unserialize'
import { URLSearchParams } from 'node:url'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

async function main () {
  const {
    drupal: drupalVersion,
    _: mysqlArgs
  } = yargs(hideBin(process.argv))
    .usage('$0 -- <mysql args>')
    .option('drupal', {
      desc: 'Specify the Drupal version so that we can query the database correctly',
      number: true,
      choices: [7, 8, 9],
      default: 7
    })
    .argv

  const redirects = await getRedirects(mysqlArgs, { drupalVersion })
  for (const [from, to] of redirects) {
    console.log([from, to].join('\t'))
  }
}

main()

async function getRedirects (mysqlArgs, { drupalVersion }) {
  while (mysqlArgs[0] === 'mysql') mysqlArgs.shift()
  const mysql = execa('mysql', [...mysqlArgs, '-A'], { stdin: 'pipe', stdout: 'pipe', stderr: 'inherit' })

  let redirects = []
  if (drupalVersion === 8) {
    redirects = getDrupal8Redirects(mysql)
  } else {
    redirects = getDrupal7Redirects(mysql)
  }
  await onExit(mysql)
  return redirects
}

/**
 * @param {import('execa').ExecaChildProcess} mysql
 * @returns {[string, string][]}
 */
async function getDrupal7Redirects (mysql) {
  const cols = {
    source: 'from',
    source_options: 'fromOptions',
    redirect: 'to',
    redirect_options: 'toOptions'
  }
  const query = `
    SELECT ${Object.entries(cols).map(([key, alias]) => `${key} AS "${alias}"`).join(', ')}
    FROM redirect
    WHERE status = 1
    ORDER BY source ASC
  `

  await streamWrite(mysql.stdin, query)
  await streamEnd(mysql.stdin)

  const rows = await parseRows(mysql.stdout, cols)
  const redirects = []
  for (const { from, fromOptions, to } of rows) {
    let fromURL = from
    try {
      const fromOptionsObject = unserialize(fromOptions)
      if (fromOptionsObject.query instanceof Object) {
        fromURL = `${from}?${new URLSearchParams(fromOptionsObject.query)}`
      }
    } catch (error) {
      // console.error('whoops:', error)
    }
    redirects.push([
      pathOrQualifiedURL(fromURL),
      pathOrQualifiedURL(to)
    ])
  }
  return redirects
}

/**
 * @param {import('execa').ExecaChildProcess} mysql
 * @returns {[string, string][]}
 */
async function getDrupal8Redirects (mysql) {
  const cols = {
    redirect_source__path: 'from',
    redirect_redirect__uri: 'to'
  }
  const query = `
    SELECT ${Object.entries(cols).map(([key, alias]) => `${key} AS "${alias}"`).join(', ')}
    FROM redirect
    ORDER BY redirect_source__path ASC
  `

  await streamWrite(mysql.stdin, query)
  await streamEnd(mysql.stdin)

  const rows = await parseRows(mysql.stdout, cols)
  return rows.map(({ from, to }) => [
    pathOrQualifiedURL(from),
    pathOrQualifiedURL(to)
  ])
}

/**
 *
 * @param {import('execa').ExecaChildProcess['stdout']} stream
 * @param {Record<string, string>[]} columns
 * @returns {Record<typeof columns[string], string>[]}
 */
async function parseRows (stream, columns) {
  const rawOutput = await readableToString(stream)
  const lines = rawOutput.trim().split(/[\n\r]+/)
  // skip the header
  lines.shift()
  const colNames = Object.values(columns)
  return lines.map(line => {
    const values = line.split('\t')
    return Object.fromEntries(colNames.map((col, i) => [col, values[i]]))
  })
}

function pathOrQualifiedURL (str) {
  return /^https?:/.test(str) ? str : addPrefix(str, '/')
}

function addPrefix (str, prefix) {
  return str.startsWith(prefix) ? str : `${prefix}${str}`
}
