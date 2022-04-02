# Development guidelines

## Local development

This is a complicated application. It's intended to redirect traffic from an
ever-growing list of decommissioned City sites to either more up-to-date pages
on SF.gov or archived "snapshots" of essentially arbitrary URLs.

We [decided](./adr/001-hosting.md) to host this on Heroku so that we have lots
of technology options, and we [chose Apache](./adr/002-server.md) because it's
rock-solid and well understood. We've also decided (ADR?) to use [Docker Compose]
for local development because it allows us not only to run Apache in a
[container][] (rather than with a globally installed `httpd`) but also to
simulate requests to different hostnames via its [network layer][compose
networks].

**TL;DR**: Running the app locally should only require:

1. [Install Docker]
2. Copy `.env.template` to `.env`
3. Run `docker-compose up`
4. Visit [localhost:8080](http://localhost:8080) to see the `archive.sf.gov`
   landing page

You can customize the port to test by modifying the `PORT=` line of your local
`.env` file, then [restarting the app](#restart-the-app).

See [docker-compose.yml](../docker-compose.yml) for an annotated description of
the local development setup.

### httpd configuration
Our `httpd` configurations live in [httpd/conf](../httpd/conf/), and are
separated out ease development:

- [main.conf] is our main configuration "entrypoint"
- [heroku.conf](../httpd/conf/heroku.conf) is the config that we load in the
  `web` process in the [Procfile]. This config makes Heroku-specific adjustments
  then includes `main.conf`.
- [Site configurations](#site-configurations) live in the [sites
  directory](../httpd/conf/sites/).

### Site configurations
Each site that we archive should get its own configuration file. Our [main
config] uses a glob pattern to include all of the sites, so every `.conf` file
in the sites directory is included automatically:

```apache
Include /app/conf/sites/*.conf
```

Each site config should contain one or more [VirtualHost] directives that
[rewrite][] (and/or [redirect]) requests to the domains in question. The general pattern will likely be:

```apache
<VirtualHost {{domain}}.org>
  ServerName {{domain}}.org
  # enable wildcard matching, e.g. for www.
  ServerAlias *.{{domain}}.org

  # inline redirects here

  RewriteEngine On
  
  # write explicit redirects to {{domain}}.tsv with whitespace (tabs!)
  # in between the path ("/") and the fully-qualified sf.gov URL
  # ("https://sf.gov/...")
  RewriteMap redirect "txt:/app/httpd/conf/sites/{{domain}}.tsv"

  # this rewrite rule checks the rewrite map first (before the "|"),
  # then falls back on the URL after the "|" with the request path
  # in place of "$1" 
  RewriteRule "^(.*)$" "${redirect:$1|https://wayback.archive-it.org/{{collection}}/3/https://{{domain}}$1}"
</VirtualHost>
```

### Restart the app
Our app runs `httpd` in the foreground rather than forking, so when you run
`docker-compose up` you'll see the logs streaming and can kill the server by
pressing <kbd>Control+C</kbd> (or the equivalent in your shell of choice). To
restart the server, just run `docker-compose up` again.

[compose networks]: https://docs.docker.com/compose/networking/
[container]: https://docs.docker.com/get-started/#what-is-a-container
[docker]: https://docs.docker.com/get-started/
[docker compose]: https://docs.docker.com/compose/
[docker volumes]: https://docs.docker.com/storage/volumes/
[install docker]: https://docs.docker.com/get-docker/
[procfile]: ../Procfile
[main config]: ../httpd/conf/main.conf
[virtualhost]: https://httpd.apache.org/docs/2.4/mod/core.html#virtualhost
[rewrite]: https://httpd.apache.org/docs/2.4/mod/mod_rewrite.html
[redirect]: https://httpd.apache.org/docs/2.4/rewrite/avoid.html#redirect