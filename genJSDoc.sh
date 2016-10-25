#!/bin/sh
cd "$(dirname "$0")"
cd js
./node_modules/.bin/jsdoc ./ --destination ../jsdoc --readme ../README.md --template ./node_modules/minami