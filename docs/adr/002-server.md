# Web server

* Status: **approved**
* Deciders: [Shawn Allen](https://github.com/shawnbot)
* Date: 2022-03-23

## Context and Problem Statement

We need a mature, battle-tested web server to front requests to our archive
redirect service. In [our first ADR](./001-hosting.md) we decided to use Heroku as our hosting platform. The basic shape of our infrastructure will be the same regardless of which web ("frontend") server we choose: a [reverse proxy] in which the server will accept client HTTP requests and forward them to our redirect application (the "backend") server and pass the response back:

```mermaid
flowchart LR
  Client <--> Server
  Server <-->|reverse proxy| App
```

All of the considered options have a proven track record of working in this configuration. More importantly, though, we're looking for a server that simplifies the management and testing of our redirect rules. As of this ADR, our needs are:

- Match requests on one or more (wildcard) domains, e.g. `sftreasureisland.org` and `www.sftreasureisland.org`
- Manage redirects for specific paths (e.g. `/` or `/meetings`) to `sf.gov`
- Redirect URLs without managed redirects to archived pages
- Serve static assets for the `archive.sf.gov` front end
- Run redirect rule tests as part of our CI workflow
- Scale in response to heavy loads
- Protect the application server from bad requests

## Considered options

* [Apache](#apache)
* [HAProxy](#haproxy)
* [NGINX](#nginx)
* [Varnish](#varnish)

## Decision outcome

Chosen option: **[Apache](#apache)**

### Positive consequences <!-- optional -->

* It does everything we need it to
* Apache is the most mature option, so tutorials and examples are widespread
* Its documentation is great

### Negative consequences <!-- optional -->

* We don't get to brag about using a more "modern" server
* No built-in HTTP "normalization" or protection from malicious/malformed requests (but examples for said protection are easy to find!)

## Pros and cons of each option

Listed in alphabetical order...

### Apache

[Apache] was the most popular web server for nearly two decades. It serves static content reliably, and its built-in module for managing URL redirects is [mod_rewrite], can read a [rewrite map](https://httpd.apache.org/docs/2.2/mod/mod_rewrite.html#rewritemap) from text files (or precompiled dbm formats for faster lookups).

* Good, because it can serve static content
* Good, because it can scale horizontally
* Good, because it can cache with its [mod_cache](https://httpd.apache.org/docs/2.4/mod/mod_cache.html) extension
* Good, because it can function as a [pass-through reverse proxy](https://httpd.apache.org/docs/2.4/mod/mod_proxy.html#proxypass)
* Good, because its [VirtualHost directive](https://httpd.apache.org/docs/2.4/mod/core.html#virtualhost) allows hostname-specific configuration
* Bad, because it's the least "interesting" (most boring) option

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

### HAProxy

[HAProxy] is explicitly designed as a proxy and can only route requests between other servers. It can't serve static content, so we would need to run a separate server for static `archive.sf.gov` content.

* Good, because it's fast and doesn't require a lot of resources on its own
* Good, because it can act as an "HTTP normalizer" and protect the app server from malicious and/or malformed requests
* Bad, because it has a cryptic [configuration format](http://cbonte.github.io/haproxy-dconv/2.5/configuration.html#2.1) that nobody on our team understands
* Bad, because it [does not serve static content](http://cbonte.github.io/haproxy-dconv/2.5/intro.html#3.1)
* Bad, because it [does not cache non-`200` statuses](http://cbonte.github.io/haproxy-dconv/2.5/configuration.html#6.1) (we will primarily be serving `301` redirects)

#### Configuration sample
```haproxy
# I have no idea how this thing works
frontend http-in
  bind *:${PORT}
  mode http
  use_backend web if { hdr(host) -i archive.sf.gov }
  use_backend sftreasureisland if { hdr(host) -i .sftreasureisland.org }
  default_backend redirect 
  
backend web
  # we will need a static web server on another port
  server web 0.0.0.0:8080
  
backend sftreasureisland
  server sftreasureisland1
  http-request set-var(proc.map) "${APP_ROOT}/redirects/sftreasureisland.map"
  http-request redirect location %[capture.req.uri,map(var(proc.map))] code 301 if { capture.req.uri,map(var(proc.map)) -m found }
  default_backend redirect
  
backend redirect
  mode http
  server redirect1 0.0.0.0:80
```

### NGINX

NGINX is another very popular web server with built-in static file serving and reverse proxy capabilities.

* Good, because our team has some experience with it
* Good, because its configuration offers host-specific (domain-specific) routing via the [`server_name` directive](http://nginx.org/en/docs/http/server_names.html)
* Good, because its [proxy module](http://nginx.org/en/docs/http/ngx_http_proxy_module.html) supports easily configurable pass-throughs to backends and can [modify request headers](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_set_header)
* Good, because it has a highly configurable [built-in cache](https://docs.nginx.com/nginx/admin-guide/content-cache/content-caching/) that can vary TTLs by HTTP status
* Bad, because it has a relatively cryptic [configuration format](https://docs.nginx.com/nginx/admin-guide/basic-functionality/managing-configuration-files/)

#### Configuration sample
Note: NGINX doesn't support environment variable substitution by default, so we would need to [preprocess it with `envsubst`](https://github.com/docker-library/docs/tree/master/nginx#using-environment-variables-in-nginx-configuration) (e.g.).

```nginx
server_name archive.sf.gov {
  location / {
    root ${APP_ROOT}/public;
  }
}

server_name .sftreasureisland.org {
  map $request_uri $redirect_url {
    default "";
    include ${APP_ROOT}/redirects/sftreasureisland.txt;
  }
  if $redirect_url {
    return 302 $redirect_url;
  }
  proxy_pass http://0.0.0.0:80/;
}

server {
  proxy_pass http://0.0.0.0:80/;
}
```

### Varnish

[Varnish] really only does the caching part of what we need. So while it may not be a viable option for our front-line server, it is known to work well as a backend that caches other front ends:

```mermaid
flowchart LR
  Client <--> Server
  Server <--> Varnish
  Varnish <--> App
```

This may be too complicated a stack for our first iteration, but it's something to consider if our caching needs grow substantially (i.e. if we're going to be proxying archived content directly through `archive.sf.gov`, instead of just redirecting).

* Good, because it has a [caching admin console](https://varnish-cache.org/docs/7.0/reference/varnishadm.html#varnishadm-1) that can be used to inspect and flush the cache
* Bad, because it has [its own configuration language, VCL](https://varnish-cache.org/docs/7.0/reference/vcl.html), which nobody on our team understands

#### Configuration sample
No sample included because the configuration is too complex 😬


[apache]: https://httpd.apache.org/docs/2.2/
[haproxy]: https://www.haproxy.org/
[mod_rewrite]: https://httpd.apache.org/docs/2.2/mod/mod_rewrite.html
[nginx]: https://nginx.org/en/docs/
[reverse proxy]: https://en.wikipedia.org/wiki/Reverse_proxy
[varnish]: https://varnish-cache.org/
