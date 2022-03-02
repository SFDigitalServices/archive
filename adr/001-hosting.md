# Hosting

* Status: proposed
* Deciders: TBD
* Date: 2022-03-01

<!-- Technical Story: TBD -->

## Context and Problem Statement

The archive web server will primarily serve as a [URL redirect] engine for legacy sites. It will need to:

1. Accept HTTP requests from multiple domains (respecting the `Host` header)
2. Redirect known URLs to their new homes on [sf.gov][] (explicit redirects)
3. Redirect all other document URLs (HTML, PDF, Word, Excel, etc.) to their archived snapshots
4. Serve helpful [404] responses to all other URLs

From an engineering standpoint, we also expect to:

* Easily run, develop, and test the server locally
* Run tests locally, in CI, and in review environments
* Have alerts that notify us when problems arise
* Have easily accessible logs to diagnose problems
* Scale the web server to meet high traffic demands

We need to choose a hosting platform that serves these needs.

## Considered Options

* [Azure functions](#azure-functions)
* [Heroku](#heroku)
* [Pantheon](#pantheon)

## Decision Outcome

Chosen option: TBD

### Positive Consequences <!-- optional -->

* {e.g., improvement of quality attribute satisfaction, follow-up decisions required, …}
* …

### Negative Consequences <!-- optional -->

* {e.g., compromising quality attribute, follow-up decisions required, …}
* …

## Pros and Cons of the Options <!-- optional -->

### Azure functions

[Azure functions] are Microsoft's answer to AWS Lambda and other serverless offerings. They can be used for on-demand compute tasks, but our interest is in [HTTP triggers](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook-trigger?tabs=javascript), which run as responders to HTTP requests.

* Good, because we have access to Azure through DT
* Good, because Microsoft offers great enterprise support
* Good, because [Application Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview) might serve our monitoring/alert needs out of the box
* Good, because [function proxies](https://docs.microsoft.com/en-us/azure/azure-functions/functions-proxies) may offer a nice management UI for redirect rules
* Bad, because it's already proven to be unwieldy and difficult to set up
* Bad, because we don't have a lot of deep experience with Azure, and not everyone on the engineering team has access to it yet
* Bad, because there doesn't appear to be first-class support for review environments, and requires orchestration of [deployment slots](https://docs.microsoft.com/en-us/azure/azure-functions/functions-deployment-slots)
* … <!-- numbers of pros and cons can vary -->

### Pantheon

[Pantheon] is the CMS hosting platform for both [sf.gov] and [sfgov.org]. We currently use it exclusively for hosting Drupal sites.

* Good, because we already use and trust Pantheon
* Good, because Pantheon _may_ support the types of managed URL redirection that we need
* Bad, because Pantheon [does not currently support modifying `nginx.conf`](https://pantheon.io/docs/platform-considerations#nginxconf)] and may require us going through their support team to manage rules
* Bad, because what we need for doesn't fit neatly into Pantheon's CMS-focused hosting/management model

**Note:** We haven't been able to fully evaluate Pantheon's suitability for this project yet. We may revisit this ADR after meeting with them on 3/29/22.

### Heroku

We run lots of sites, microservices, and other apps (including [DAHLIA](https://housing.sfgov.org)) on [Heroku].

* Good, because we use it, know it, and mostly like it already
* Good, because we would have direct control over the entire stack and could craft it to serve our needs
* Bad, because it's more expensive and we're trying to reduce our costs
* Bad, because (as of 3/1/22) the platform [does not yet support HTTP/2](https://devcenter.heroku.com/articles/http-routing#http-versions-supported), which [may prove useful](https://www.ctrl.blog/entry/http2-push-redirects.html)

[404]: https://en.wikipedia.org/wiki/HTTP_404
[sf.gov]: https://sf.gov
[sfgov.org]: https://sfgov.org
[URL redirect]: https://en.wikipedia.org/wiki/URL_redirection
[nginx]: https://nginx.org/en/docs/
[heroku]: https://www.heroku.com/
[pantheon]: https://pantheon.io/
[azure functions]: https://azure.microsoft.com/en-us/services/functions/
