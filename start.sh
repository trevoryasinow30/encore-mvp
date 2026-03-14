#!/usr/bin/env bash
set -euo pipefail

wait_for_postgres() {
  echo "⏳ Waiting for PostgreSQL to be ready..."
  until docker compose exec -T postgres pg_isready -U encore -d encore_db >/dev/null 2>&1; do
    sleep 2
  done
  echo "✅ PostgreSQL is ready"
}

require_docker_daemon() {
  if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker Desktop is not running."
    echo "   Start Docker Desktop, wait for it to finish booting, then rerun: ./start.sh"
    exit 1
  fi
}

spotify_credentials_configured() {
  node -e "require('dotenv').config(); process.exit(process.env.SPOTIFY_CLIENT_ID?.trim() && process.env.SPOTIFY_CLIENT_SECRET?.trim() ? 0 : 1)"
}

lastfm_api_key_configured() {
  node -e "require('dotenv').config(); process.exit(process.env.LASTFM_API_KEY?.trim() ? 0 : 1)"
}

database_initialized() {
  docker compose exec -T postgres psql -U encore -d encore_db -tAc \
    "SELECT to_regclass('public.\"User\"') IS NOT NULL;" 2>/dev/null | grep -q "t"
}

images_initialized() {
  docker compose exec -T postgres psql -U encore -d encore_db -tAc \
    "SELECT COUNT(*) FROM \"Song\" WHERE \"albumImageUrl\" IS NOT NULL AND \"albumImageUrl\" <> '';" \
    2>/dev/null | tr -d '[:space:]' | grep -qv "^0$"
}

market_needs_repair() {
  docker compose exec -T postgres psql -U encore -d encore_db -tAc \
    "SELECT CASE
       WHEN (SELECT COUNT(*) FROM \"MarketState\") > 0
        AND (SELECT COUNT(*) FROM \"PriceHistory\") = 0
        AND (SELECT COUNT(*) FROM \"MarketState\" WHERE price = 0.50) = (SELECT COUNT(*) FROM \"MarketState\")
       THEN true
       ELSE false
     END;" 2>/dev/null | tr -d '[:space:]' | grep -q "t"
}

print_spotify_note() {
  if spotify_credentials_configured; then
    echo "🎧 Spotify credentials detected."
    echo "   Run pnpm spotify:sync if you want to backfill Spotify track IDs and artwork."
  else
    echo "ℹ️  Spotify credentials are not set."
    echo "   Spotify sync is optional and only used for track metadata/artwork."
  fi
  echo ""
}

print_lastfm_note() {
  if lastfm_api_key_configured; then
    echo "📻 Last.fm API key detected."
    echo "   Listening data will sync in the background after the app starts."
  else
    echo "ℹ️  LASTFM_API_KEY is not set."
    echo "   Prices will stay in demo mode until you add a Last.fm API key."
  fi
  echo ""
}

echo "🎵 Starting Encore MVP..."
echo ""

require_docker_daemon

if [ ! -f .env ] || [ ! -d node_modules ]; then
  echo "🔧 First run detected. Bootstrapping the app..."
  bash setup.sh
else
  echo "🔧 Ensuring Prisma client is generated..."
  pnpm prisma:generate

  if ! docker compose ps postgres 2>/dev/null | grep -q "running"; then
    echo "🐘 Starting PostgreSQL..."
    docker compose up -d postgres
  fi

  wait_for_postgres
  pnpm db:ensure-lastfm

  if ! database_initialized; then
    echo "🗄️  Database is empty. Applying schema and seed data..."
    pnpm db:setup
    pnpm db:ensure-lastfm
    pnpm seed
  fi

  if market_needs_repair; then
    echo "🛠️  Repairing demo market after an invalid Spotify price sync..."
    pnpm market:repair
    echo ""
  fi

  print_spotify_note
  print_lastfm_note

  if ! images_initialized; then
    echo "🖼️  Artwork is missing. Fetching thumbnails..."
    if ! pnpm fetch:images; then
      echo "⚠️  Artwork fetch failed. The app will still run, but some thumbnails may be missing."
    fi
  fi
fi

echo ""
echo "🚀 Starting development server..."
echo "   Next.js will print the local URL below"
echo "   Market automation will run locally in the background"
echo "   Demo login: demo / demo123"
echo ""

pnpm dev:with-cron
