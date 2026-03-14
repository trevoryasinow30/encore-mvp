#!/usr/bin/env bash
set -euo pipefail

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "❌ Missing required command: $1"
    exit 1
  fi
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

wait_for_postgres() {
  echo "⏳ Waiting for PostgreSQL to be ready..."
  until docker compose exec -T postgres pg_isready -U encore -d encore_db >/dev/null 2>&1; do
    sleep 2
  done
  echo "✅ PostgreSQL is ready"
}

populate_images_if_missing() {
  local image_count
  image_count=$(docker compose exec -T postgres psql -U encore -d encore_db -tAc \
    "SELECT COUNT(*) FROM \"Song\" WHERE \"albumImageUrl\" IS NOT NULL AND \"albumImageUrl\" <> '';" \
    2>/dev/null | tr -d '[:space:]')

  if [ "${image_count:-0}" = "0" ]; then
    echo "🖼️  Fetching song artwork..."
    if pnpm fetch:images; then
      echo "✅ Artwork fetched"
    else
      echo "⚠️  Artwork fetch failed. The app will still run, but some thumbnails may be missing."
    fi
    echo ""
  fi
}

print_spotify_note() {
  if spotify_credentials_configured; then
    echo "🎧 Spotify credentials detected."
    echo "   Run pnpm spotify:sync to backfill Spotify track IDs and artwork."
  else
    echo "ℹ️  Spotify credentials are not set."
    echo "   Spotify sync is optional and only used for track metadata/artwork."
  fi
  echo ""
}

print_lastfm_note() {
  if lastfm_api_key_configured; then
    echo "📻 Last.fm API key detected."
    echo "   Start the app with ./start.sh and the background automation will sync listening data."
  else
    echo "ℹ️  LASTFM_API_KEY is not set."
    echo "   Prices will stay in demo mode until you add a Last.fm API key."
  fi
  echo ""
}

echo "🎵 Setting up Encore MVP..."
echo ""

require_command pnpm
require_command docker
require_docker_daemon

if [ -n "${CODESPACE_NAME:-}" ]; then
  NEXTAUTH_URL="https://${CODESPACE_NAME}-3000.app.github.dev"
  echo "🌐 Detected GitHub Codespace: ${NEXTAUTH_URL}"
else
  NEXTAUTH_URL="http://localhost:3000"
  echo "🌐 Local environment detected"
fi

if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cat > .env <<EOF
DATABASE_URL="postgresql://encore:encore123@localhost:5432/encore_db"
NEXTAUTH_SECRET="dev-secret-key-not-for-production-use-only"
NEXTAUTH_URL="${NEXTAUTH_URL}"
ADMIN_PASSWORD="admin123"
CRON_SECRET="dev-secret-change-in-production"
MARKET_TICK_SCHEDULE="*/5 * * * *"
LASTFM_SYNC_SCHEDULE="15 * * * *"
LASTFM_API_KEY=""
SPOTIFY_CLIENT_ID=""
SPOTIFY_CLIENT_SECRET=""
SPOTIFY_MARKET="US"
EOF
  echo "✅ .env created"
else
  echo "✅ Using existing .env"
fi
echo ""

echo "📦 Installing dependencies..."
pnpm install
echo "✅ Dependencies installed"
echo ""

echo "🔧 Generating Prisma client..."
pnpm prisma:generate
echo "✅ Prisma client generated"
echo ""

echo "🐘 Starting PostgreSQL..."
docker compose up -d postgres
wait_for_postgres
echo ""

echo "🗄️  Applying database schema..."
pnpm db:setup
pnpm db:ensure-lastfm
echo "✅ Schema applied"
echo ""

echo "🌱 Seeding demo data..."
pnpm seed
echo "✅ Demo data seeded"
echo ""

print_spotify_note
print_lastfm_note

populate_images_if_missing

echo "🎉 Setup complete!"
echo ""
echo "📝 Demo credentials:"
echo "   demo / demo123"
echo "   trader1 / trader123"
echo "   musicfan / music123"
echo ""
echo "🚀 Next steps:"
echo "   ./start.sh"
echo "   or pnpm dev"
echo ""
echo "🌐 App URL: ${NEXTAUTH_URL}"
