# Use express

* Status: **approved**
* Deciders: [Shawn Allen](https://github.com/shawnbot)
* Date: 2022-07-07

## Context and Problem Statement

In [the previous ADR](./002-server.md), we decided to use [httpd][] (sometimes referred to as "Apache") as our web server.

After a couple of months of battling Docker and VirtualHost directives, we are reconsidering this decision. The criteria for the previous ADR still stands:

* Match requests on one or more (wildcard) domains, e.g. `sftreasureisland.org` and `www.sftreasureisland.org`
* Match requests by path on shared domains, namely `sfgov.org`
* Provide redirects for archived sites to their new homes (typically on `sf.gov`)
* Route URLs without explicit redirects to archived snapshots
* Serve static assets for the `archive.sf.gov` front end
* Run redirect rule tests as part of our CI workflow
* Scale in response to heavy loads
* Protect the application server from bad requests

### httpd challenges

We ran into a number of issues developing and deploying httpd to Heroku. The saga of the initial httpd setup challenge is told in [#10](https://github.com/SFDigitalServices/archive/pull/10) and the test suite setup in [#11](https://github.com/SFDigitalServices/archive/pull/11). Notably:

* Docker is basically the only sane way to run httpd locally, both to reduce platform inconsistencies and because it wants to be run as `root` in order to bind to ports 80 and 443. However, building and running Docker apps in Heroku is not in our wheelhouse.

* Running a different stack (Node.js) for testing added an additional layer of local development complexity, i.e. `docker-compose`. The software itself is great; the problem is that it's not directly supported by Heroku, which poses the question of whether to support and maintain two different execution environments (`docker-compose` locally and an httpd-oriented buildpack on Heroku) or a less well-understood tool like [dockhero](https://dockhero.io/).

* There don't appear to be any popular and/or well-maintained buildpacks for httpd _only_. The best option, in terms of popularity and maintenance, appears to be Heroku's official [PHP buildpack](https://elements.heroku.com/buildpacks/heroku/heroku-buildpack-php).

* [Name-based hosts](https://httpd.apache.org/docs/2.4/vhosts/name-based.html) in httpd are difficult to configure, involving a squirrelly combination of `ServerName`, `<VirtualHost>`, and `ServerAlias` directives.

* httpd's [mod_macro](https://httpd.apache.org/docs/2.4/mod/mod_macro.html) would be useful for generating the requisite `<VirtualHost>` directives for a growing number of sites (rather than maintaining dozens of similarly structured configurations manually), but the module isn't compiled in the Heroku PHP buildpack, and there isn't an obvious way to configure the buildpack to compile additional httpd modules.

> ⚠️ In retrospect, we should have done more research to better understand the Heroku landscape and the complexities of running httpd locally before approving [the previous ADR](./002-server.md).

## Considered options

* [httpd](#httpd)
* [Express](#express)

## Decision outcome

We will rebuild the server on [Express](#express).

### Positive consequences <!-- optional -->

* Simpler to deploy
* Dramatically simpler development environment (no Docker)
* Custom configuration features
* More flexibility in almost all respects

### Negative consequences <!-- optional -->

* More custom code to maintain

## Pros and cons of each option

### Apache

[Apache] was the most popular web server for nearly two decades. It serves static content reliably, and its built-in module for managing URL redirects is [mod_rewrite], can read a [rewrite map](https://httpd.apache.org/docs/2.2/mod/mod_rewrite.html#rewritemap) from text files (or precompiled dbm formats for faster lookups).

* Good, because it can serve static content
* Good, because it can scale horizontally
* Good, because it can cache with its [mod_cache](https://httpd.apache.org/docs/2.4/mod/mod_cache.html) extension
* Good, because it can function as a [pass-through reverse proxy](https://httpd.apache.org/docs/2.4/mod/mod_proxy.html#proxypass)
* ~~Good, because its [VirtualHost directive](https://httpd.apache.org/docs/2.4/mod/core.html#virtualhost) allows hostname-specific configuration~~
* **Bad, because VirtualHost directives are notoriously hard to manage**
* Bad, because it's the least "interesting" (most boring) option
* Bad, because it's complicated to run on Heroku

#### Configuration sample

```apache
ProxyPreserveHost On

<VirtualHost archive.sf.gov:${PORT}>
  DocumentRoot "${APP_ROOT}/public"
</VirtualHost>

<VirtualHost sftreasureisland.org www.sftreasureisland.org>
  RewriteEngine on
  RewriteMap sftreasureisland "txt:${APP_ROOT}/redirects/sftreasureisland.txt"

  # I'm not sure if we need ProxyPass + ProxyPassReverse here, or if requests
  # will fall through to the *:* VirtualHost block below 🤔
</VirtualHost>

<VirtualHost *:*>
  ProxyPass         / "http://0.0.0.0:80/"
  ProxyPassReverse  / "http://0.0.0.0:80/"
</VirtualHost>
```

### Express

[Express] is the most venerable web server in the Node.js ecosystem. Here's a simple example using [vhost] and an theoretical `archiveRedirect()` handler that can read redirect maps from disk and send requests that fall through to the wayback machine URL for a known Archive-It collection:

```js
import express from 'express'
import vhost from 'vhost'
import { archiveRedirect } = './handlers'

const app = express()
  .use(vhost('sftreasureisland.org'), archiveRedirect({
    redirectMap: 'sites/sftreasureisland.org/redirects.tsv',
    collectionId: 18901
  }))
  .use(vhost('innovation.sfgov.org'), archiveRedirect({
    redirectMap: 'sites/innovation.sfgov.org/redirects.tsv',
    collectionId: 19260
  }))
  .use(express.static('public'))

const server = app.listen(process.env.PORT, () => {
  const { address, port } = server.address()
  const host = address === '::' ? 'localhost' : address
  console.log('Listening on http://%s:%d', host, port)
})
```

The `archiveRedirect()` handler could be implemented in about 20 lines, e.g.:

```js
export function archiveRedirect ({ redirectMap, collectionId }) {
  const redirectMap = readFileSync(redirectMap, 'utf8')
    .split(/[\r\n]+/)
    .map(line => line.trim())
    .filter(line => line.length && !line.startsWith('#'))
    .reduce((map, line) => {
      const [from, to] = line.split(/\s+/)
      map.set(from, to)
      return map
    }, new Map())
  return express.Router()
    .use((req, res, next) => {
      const url = redirectMap.get(req.path) || redirectMap.get(req.originalUrl)
      if (url) {
        return res.redirect(url, 301)
      } else {
        return res.redirect(`https://wayback.archive-it.org/${collectionId}/3/${req.hostname}${req.originalUrl}`, 301)
      }
    })
}
```

* Good, because it's fast and doesn't require a lot of resources on its own
* Good, because there are [thousands of packages](https://www.npmjs.com/search?q=keywords:express) that work with it, such as [vhost] for hostname-based routing, [helmet] for protecting against common attacks, and rate-limiting middleware
* Good, because it's easy to write custom rules-based routing logic
* Good, because express apps can be tested directly with tools like [supertest](https://www.npmjs.com/package/supertest#example)
* Good, because it can act as either (or both!) a backend and frontend in a [reverse proxy]
* Bad, because we may need to do some explicit [error handling](https://expressjs.com/en/guide/error-handling.html)
* Bad, because we will need to bring our own process manager (e.g. [nodemon] or [pm2]) to scale
* Bad, because we will have to do our own logging, e.g. with a package like [morgan](https://expressjs.com/en/resources/middleware/morgan.html)

[httpd]: https://httpd.apache.org/docs/2.2/
[express]: https://expressjs.com/
[mod_rewrite]: https://httpd.apache.org/docs/2.2/mod/mod_rewrite.html
[reverse proxy]: https://en.wikipedia.org/wiki/Reverse_proxy
[vhost]: https://npmjs.com/package/vhost
[helmet]: https://npmjs.com/package/helmet
[nodemon]: https://nodemon.io/
[pm2]: https://pm2.keymetrics.io/
