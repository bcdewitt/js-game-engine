#!/bin/sh
cd "$(dirname "$0")"
cd js
./node_modules/.bin/eslint *.js