#!/usr/bin/env bash
set -euo pipefail

if [ -d ".next" ]; then
  echo "🧹 Resetting Next.js build cache..."
  rm -rf .next
fi

exec ./node_modules/.bin/next dev "$@"
