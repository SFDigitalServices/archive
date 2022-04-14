#!/bin/bash
HEROKU_APP_NAME=${HEROKU_APP_NAME:-$1}
if [ -z "$HEROKU_APP_NAME" ]; then
  echo "HEROKU_APP_NAME is not set; skipping domain:add"
  exit
fi

if [ "$HEROKU_APP_NAME" -eq "sfgov-archive" ]; then
  echo "No auto-domains to set in production"
  exit
fi

echo "Setting up auto-domains for $HEROKU_APP_NAME..."
for host in `perl -ne 'print "$1\n" if /ServerAlias .*HEROKU_APP_NAME}?\.(.+)"?$/;' httpd/conf/**/*.conf`; do
  domain="$HEROKU_APP_NAME.$host"
  npx heroku domains:add -a "$HEROKU_APP_NAME" "$domain" \
    || echo "Unable to add domain '$domain' to app '$HEROKU_APP_NAME'"
done