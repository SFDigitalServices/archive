import { Request, Response } from 'express'
import { readFileSync } from 'fs'
import yaml from 'js-yaml'
import UrlPattern from 'url-pattern'
import { getRequestUrl } from './archive'

export interface Matcher {
  /**
   * Determine whether a URL matches (boolean)
   * @param url the source URL
   */
  match(url: string): boolean
  /**
   * Resolve a source URL (if it matches) into a target URL
   * @param url the source URL
   */
  resolve(url: string): string
}

export type PathRulesDict = {
  [pattern: string]: string
}

export type HostRule = {
  paths: PathRulesDict
}

export type HostRulesDict = {
  [pattern: string]: HostRule
}

export type RulesIndex = {
  redirect: {
    hosts: HostRulesDict
  }
}

export function loadMatcher (path: string, options?: Partial<yaml.LoadOptions>): Matcher {
  const contents = readFileSync(path, 'utf8')
  const data = yaml.load(contents, { schema: yaml.JSON_SCHEMA, ...options }) as RulesIndex

  const matchers: Matcher[] = []
  for (const [hostPattern, hostRule] of Object.entries(data.redirect.hosts)) {
    for (const [pathPattern, targetUrl] of Object.entries(hostRule.paths)) {
      matchers.push(new URLMatcher(hostPattern, pathPattern, targetUrl))
    }
  }

  return new MultiMatcher(matchers)
}

export class URLMatcher implements Matcher {
  hostPattern: string
  pathPattern: string
  urlPattern: UrlPattern
  targetUrl: string

  constructor (hostPattern: string, pathPattern: string, targetUrl: string) {
    // host patterns may constrain protocols, but if not we default to http or https
    this.hostPattern = hostPattern.includes('://')
      ? hostPattern.replace(/^(https?):/, '$1\\:')
      : `(http(s)\\://)${hostPattern}`
    // path patterns _must_ start with a /, so we add it here if it's not present
    this.pathPattern = pathPattern.startsWith('/')
      ? pathPattern
      : pathPattern ? `/${pathPattern}` : '(/)'
    const urlPattern = `${this.hostPattern}${this.pathPattern}`
    this.urlPattern = new UrlPattern(urlPattern)
    this.targetUrl = targetUrl
  }

  match (url: string): boolean {
    return this.urlPattern.match(url) !== null
  }

  resolve (url: string): string {
    const match = this.urlPattern.match(url) as object
    return match ? expand(this.targetUrl, match) : undefined
  }
}

export class MultiMatcher implements Matcher {
  matchers: Matcher[]

  constructor (matchers: Matcher[]) {
    this.matchers = matchers
  }

  match (url: string): boolean {
    return this.matchers.some(matcher => matcher.match(url))
  }

  resolve (url: string): string {
    let resolved: string
    for (const matcher of this.matchers) {
      resolved = matcher.resolve(url)
      if (resolved) return resolved
    }
    return undefined
  }
}

export function expand (url: string | UrlPattern, data: object): string {
  return (url instanceof UrlPattern)
    ? url.stringify(data)
    : url
}

export function explicitRedirectHandler (matcher: Matcher) {
  return (req: Request, res: Response, next: CallableFunction): void => {
    const url = res.locals.url as string || getRequestUrl(req)
    console.warn('[explicit] url: "%s"', url)
    const target = matcher.resolve(url)
    if (target) {
      res.redirect(301, target)
    } else {
      next()
    }
  }
}
