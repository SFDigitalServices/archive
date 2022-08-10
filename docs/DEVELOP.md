# Development guidelines

## Local development

This isn't a complicated application, but it promises to grow over time. It's
intended to redirect traffic from an ever-growing list of decommissioned City
sites to either more up-to-date pages on SF.gov or archived "snapshots" of
essentially arbitrary URLs.

We [decided](./adr/001-hosting.md) to host this on Heroku so that we have lots
of technology options, and we [chose Express](./adr/003-express.md) because it's
easy to use and well supported.

**TL;DR**: Running the app locally should only require:

1. Install Node.js version 16 or above
2. Copy `.env.template` to `.env`
3. Run `npm start` to start the development server using [nodemon], which restarts
   automatically whenever relevant source files are modified.
4. Visit [localhost:4001](http://localhost:4001) to see the `archive.sf.gov`
   landing page.
5. Run `npm test` (or `npm t`) to run both the unit tests and acceptance (feature)
   tests.

You can customize the port to test by modifying the `PORT=` line of your local
`.env` file, then [restarting the app](#restart-the-app).

## Tests

### Unit tests

You can run the unit tests separately from feature tests with:

```sh
npm run test:unit
```

Unit tests run with [Jest]. We aim for 100% code coverage.

### Feature tests

The [features directory](../features) contains acceptance tests written in [Gherkin]. You can run them separately from the unit tests with:

```sh
npm run test:features
```

See [features/README.md](../features/README.md#readme) for more info.

## Configuration

### Site configurations

Each site that we archive should have its own YAML configuration in the [config/sites] directory. Configurations are loaded via the glob pattern `config/sites/**/*.yml`, so they can be organized however we choose.

Site configurations are validated in CI (but not at runtime!) using [this JSON schema](config/schemas/site.json), which also provides intellisense and completion in Visual Studio Code. Fields are described in the `description` property of the schema definition.


[archive-it]: https://www.archive-it.org/
[archive redirects]: https://support.archive-it.org/hc/en-us/articles/360058264752-Redirecting-broken-links-to-web-archives-automatically
[compose networks]: https://docs.docker.com/compose/networking/
[container]: https://docs.docker.com/get-started/#what-is-a-container
[docker]: https://docs.docker.com/get-started/
[docker compose]: https://docs.docker.com/compose/
[docker volumes]: https://docs.docker.com/storage/volumes/
[gherkin]: https://cucumber.io/docs/gherkin/reference/
[install docker]: https://docs.docker.com/get-docker/
[procfile]: ../Procfile
[main config]: ../httpd/conf/main.conf
[virtualhost]: https://httpd.apache.org/docs/2.4/mod/core.html#virtualhost
[rewrite]: https://httpd.apache.org/docs/2.4/mod/mod_rewrite.html
[rewrite map]: https://httpd.apache.org/docs/2.4/mod/mod_rewrite.html#rewritemap
[redirect]: https://httpd.apache.org/docs/2.4/rewrite/avoid.html#redirect
