#!/bin/bash
HEROKU_APP_NAME=${HEROKU_APP_NAME:-$1}
if [ -z "$HEROKU_APP_NAME" ]; then
  echo "HEROKU_APP_NAME is not set; skipping domain:add"
  exit
fi

for host in `perl -ne 'print "$1\n" if /ServerAlias "?\*\.(.+)"?$/;' httpd/conf/**/*.conf`; do
  domain="$HEROKU_APP_NAME.$host"
  heroku domains:add -a "$HEROKU_APP_NAME" "$domain" \
    || echo "Unable to add domain '$domain' to app '$HEROKU_APP_NAME'"
done