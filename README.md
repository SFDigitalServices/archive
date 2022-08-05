# SFgov web archive

This repo contains code and documentation for the City & County of San Francisco's web archiving efforts.

🧑‍💻 See the [development docs](docs/DEVELOP.md) if you're looking to run the server or understand how it works.

## Goals

- Support the migration of City sites to [sf.gov]
- Facilitate [archival](#archiving) of [legacy sites](#legacy-sites) for future reference
- Ensure that old document URLs do not break ([404] or otherwise)
- Publicly document the status of the City's archiving efforts

## Scope

The scope of this project is to support the shutdown of legacy sites to [sf.gov] by taking on the web server duties of legacy sites so that they can be shut down, effectively replacing the legacy site with a set of [redirect](#redirect) rules:

- A managed set of explicit [redirects](#redirect) will point old URLs to their new homes on [sf.gov][]
- All other [document URLs](#document) will [redirect](#redirect) to [archived](#archiving) "snapshots" of the legacy site before it was shut down (implicit redirects)
- Non-[document](#document) URLs (images, stylesheets, and scripts) without explicit redirects will [404]

Implicit redirects to archived snapshots assume that all of the URLs for a legacy site have already been [archived](#archiving), since the legacy site will cease to be accessible after shutdown.

## Glossary

### Archiving

This is the process by which a single [document](#document) (typically a web page) is crawled and a "snapshot" is saved for public consumption with a web browser. The specific archival mechanism is under review and will be detailed in a forthcoming [ADR](#adrs).

### Legacy site

A "legacy site" is any City-owned site that is no longer relevant and/or superseded by more up-to-date content on [sf.gov]. Most of these are department and public body sites served under subdomains of `sfgov.org`, but some are served on other domains, such as the Board of Supervisors' `sfbos.org` or the Treasure Island Development Authority's `sftreasureisland.org`.

### Redirect

[URL redirection](https://en.wikipedia.org/wiki/URL_redirection) is a way for web servers to point browsers (and other clients, such as search engine crawlers) at a different URL. Unless otherwise noted, the specific technique is to send a [301] HTTP status with a [`Location` response header][location header] indicating the redirect URL.

### Document

In this repo, the term "document" refers to either a web page in HTML or a well-known document format (PDF, Word, Excel, etc.). Specific rules about document retention may be detailed in a forthcoming [ADR](#adrs).

## ADRs

We use [**A**rchitectural **D**ecision **R**ecords][adr] to propose, evaluate, and make decisions about technical architecture. Our ADRs are written as [Markdown] in the [docs/adr directory](./docs/adr).

[sf.gov]: https://sf.gov
[adr]: https://github.com/joelparkerhenderson/architecture-decision-record#what-is-an-architecture-decision-record
[markdown]: https://en.wikipedia.org/wiki/Markdown
[sfgov.org]: https://sfgov.org
[404]: https://en.wikipedia.org/wiki/HTTP_404
[301]: https://en.wikipedia.org/wiki/HTTP_301
[location header]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location
