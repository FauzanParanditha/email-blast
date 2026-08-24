#!/bin/sh
set -e

mkdir -p /app/apps/web/public/uploads
chown -R nextjs:nodejs /app/apps/web/public/uploads

exec su-exec nextjs "$@"
