#!/bin/bash
perl -nle 'print $1 if /ServerAlias .*\$\{?HEROKU_APP_NAME\}?\.([-\w\.]+)/;' httpd/conf/**/*.conf