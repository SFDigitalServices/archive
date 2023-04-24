#!/usr/bin/env node
import { execa } from 'execa'
import { streamWrite, readableToString, streamEnd, onExit } from '@rauschma/stringio'
import { unserialize } from 'php-unserialize'
import { URLSearchParams } from 'node:url'

async function main () {
  const argv = process.argv.slice(2)

  while (argv[0] === 'mysql') argv.shift()

  const mysql = execa('mysql', [...argv, '-A'], { stdin: 'pipe', stdout: 'pipe', stderr: 'inherit' })

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

  const rawOutput = await readableToString(mysql.stdout)
  const lines = rawOutput.trim().split(/[\n\r]+/)
  // skip the header
  lines.shift()
  const colNames = Object.values(cols)
  for (const line of lines) {
    const values = line.split('\t')
    const {
      from,
      fromOptions,
      to
    } = Object.fromEntries(colNames.map((col, i) => [col, values[i]]))
    let fromURL = from
    try {
      const fromOptionsObject = unserialize(fromOptions)
      if (fromOptionsObject.query instanceof Object) {
        fromURL = `${from}?${new URLSearchParams(fromOptionsObject.query)}`
      }
    } catch (error) {
      // console.error('whoops:', error)
    }
    console.log([
      pathOrQualifiedURL(fromURL),
      pathOrQualifiedURL(to)
    ].join('\t'))
  }

  await onExit(mysql)
}

main()

function pathOrQualifiedURL (str) {
  return /^https?:/.test(str) ? str : addPrefix(str, '/')
}

function addPrefix (str, prefix) {
  return str.startsWith(prefix) ? str : `${prefix}${str}`
}
