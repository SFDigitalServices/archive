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
4. Visit [localhost:8080](http://localhost:8080) to see the `archive.sf.gov` landing page

You can customize the port to test by modifying the `PORT=` line of your local `.env` file.

[compose networks]: https://docs.docker.com/compose/networking/
[container]: https://docs.docker.com/get-started/#what-is-a-container
[docker]: https://docs.docker.com/get-started/
[docker compose]: https://docs.docker.com/compose/
[docker volumes]: https://docs.docker.com/storage/volumes/
[install docker]: https://docs.docker.com/get-docker/