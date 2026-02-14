#!/usr/bin/env bash
set -euo pipefail

# Simple Netlify deploy helper
# Requires env vars: NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID
# Optionally set PROD=true to publish to production. Default is draft preview deploy.

if [ -z "${NETLIFY_AUTH_TOKEN-}" ] || [ -z "${NETLIFY_SITE_ID-}" ]; then
  echo "ERROR: NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID must be set in the environment"
  exit 1
fi

DIR=dist
if [ ! -d "$DIR" ]; then
  echo "Building project..."
  npm run build
fi

if [ "${PROD-}" = "true" ]; then
  echo "Deploying production site to Netlify..."
  npx netlify deploy --auth "$NETLIFY_AUTH_TOKEN" --site "$NETLIFY_SITE_ID" --dir "$DIR" --prod
else
  echo "Deploying draft preview to Netlify..."
  npx netlify deploy --auth "$NETLIFY_AUTH_TOKEN" --site "$NETLIFY_SITE_ID" --dir "$DIR"
fi

echo "Done."
