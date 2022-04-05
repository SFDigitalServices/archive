# Development guidelines

## Local development

This isn't a complicated application, but it promises to grow over time. It's
intended to redirect traffic from an ever-growing list of decommissioned City
sites to either more up-to-date pages on SF.gov or archived "snapshots" of
essentially arbitrary URLs.

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
3. Run `scripts/start.sh` or `docker-compose up` directly
4. Visit [localhost:8080](http://localhost:8080) to see the `archive.sf.gov`
   landing page

You can customize the port to test by modifying the `PORT=` line of your local
`.env` file, then [restarting the app](#restart-the-app).

See [docker-compose.yml](../docker-compose.yml) for an annotated description of
the local development setup.

### Tests
Tests live in the [tests directory](../tests) and are written in [Gherkin]. You can execute the tests by running two scripts in parallel:

- `scripts/start.sh` to start the server
- `scripts/test.sh` to run `cucumber-js`

You can reload the httpd configuration on the running container (which is faster than stopping and restarting) with `scripts/reload.sh`.

#### Step definitions
Step definitions for our Gherkin tests live in [tests/features/steps.js](../tests/features/steps.js).

### httpd configuration
Our `httpd` configurations live in [httpd/conf](../httpd/conf/), and are
separated out ease development:

- [main.conf][main config] is our main configuration entrypoint
- [heroku.conf](../httpd/conf/heroku.conf) is the config that we load in the
  `web` process in the [Procfile]. This config makes Heroku-specific adjustments
  then includes `main.conf`.
- [Site-specific configurations](#site-configurations) live in the [sites
  directory](../httpd/conf/sites/).

### Site configurations
Each site that we archive needs to have its own [VirtualHost] directive in the httpd config. There are two ways to get this:

#### ArchiveSite macro
The main config provides an `ArchiveSite` [macro][mod_macro] for site-specific one-liners:

```apache
#               domain          rewrites_file         collection_id
Use ArchiveSite some-domain.org sites/some-domain.tsv 12345
```

This will set up a [VirtualHost] block that:

- Matches the `domain` host exactly or with a wildcard subdomain (`www.${domain}`) 
- Loads the `rewrites_file` path relative to [httpd/conf/sites](../httpd/conf/sites)
- Redirects (rewrites) all requests on that domain to either:
    - The exact match from the first column in the `rewrites_file`, or
    - The latest snapshot of the full URL from [Archive-It] in the provided `collection_id`

#### Explicit site config

Sites with either more complicated rewrite logic or other needs should be
configured in a separate file in the [httpd/conf/sites](../httpd/conf/sites/)
directory. Our [main config] uses a glob pattern to include all of the sites, so
every `.conf` file in the sites directory is included automatically:

```apache
Include /app/conf/sites/*.conf
```

These configs should contain one or more [VirtualHost] directives that
[rewrite][] (and/or [redirect]) requests to the domains in question. You can use the [`ArchiveSite` macro](#archivesite-macro) defined in our [main config] as a template.

### Restart the app
Our app runs `httpd` in the foreground rather than forking, so when you run
`docker-compose up` you'll see the logs streaming and can kill the server by
pressing <kbd>Control+C</kbd> (or the equivalent in your shell of choice). To
restart the server, just run `docker-compose up` again.

[archive-it]: https://www.archive-it.org/
[compose networks]: https://docs.docker.com/compose/networking/
[container]: https://docs.docker.com/get-started/#what-is-a-container
[docker]: https://docs.docker.com/get-started/
[docker compose]: https://docs.docker.com/compose/
[docker volumes]: https://docs.docker.com/storage/volumes/
[gherkin]: https://cucumber.io/docs/gherkin/reference/
[install docker]: https://docs.docker.com/get-docker/
[procfile]: ../Procfile
[main config]: ../httpd/conf/main.conf
[mod_macro]: https://httpd.apache.org/docs/2.4/mod/mod_macro.html
[virtualhost]: https://httpd.apache.org/docs/2.4/mod/core.html#virtualhost
[rewrite]: https://httpd.apache.org/docs/2.4/mod/mod_rewrite.html
[redirect]: https://httpd.apache.org/docs/2.4/rewrite/avoid.html#redirect