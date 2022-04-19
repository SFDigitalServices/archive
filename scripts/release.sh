#!/bin/bash
HEROKU_APP_NAME=${HEROKU_APP_NAME:-$1}
if [ -z "$HEROKU_APP_NAME" ]; then
  echo "HEROKU_APP_NAME is not set; skipping domain:add"
  exit
fi

if [ "$HEROKU_APP_NAME" = "sfgov-archive" ]; then
  echo "No auto-domains to set in production"
  exit
fi

echo "Checking Heroku auth..."
npx heroku auth:whoami

echo "Setting up auto-domains for $HEROKU_APP_NAME..."
for tld in $(scripts/domains.sh); do
  # echo "tld: '$tld'"
  domain="$HEROKU_APP_NAME.$tld"
  echo "domain: '$domain'"
  npx heroku domains:add -a "$HEROKU_APP_NAME" "$domain" \
    || echo "Unable to add domain '$domain' to app '$HEROKU_APP_NAME'"
done

echo "Waiting for domains..."
npx heroku domains:wait -a "$HEROKU_APP_NAME"