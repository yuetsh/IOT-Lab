#!/bin/sh
set -e

# Copy built React dist into shared volume for Caddy
cp -r /app/client/dist/* /dist-share/

exec node index.js
