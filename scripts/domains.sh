#!/bin/bash
perl -ne 'print "$1\n" if /ServerAlias .*\$HEROKU_APP_NAME\.([-\w\.]+)/;' httpd/conf/**/*.conf