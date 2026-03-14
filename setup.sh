#!/bin/bash
set -e

echo "🎵 Setting up Encore MVP..."
echo ""

# Auto-detect environment and set NEXTAUTH_URL
if [ -n "$CODESPACE_NAME" ]; then
    NEXTAUTH_URL="https://${CODESPACE_NAME}-3000.app.github.dev"
    echo "🌐 Detected GitHub Codespace: $NEXTAUTH_URL"
else
    NEXTAUTH_URL="http://localhost:3000"
    echo "🌐 Local environment detected"
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env <<EOF
DATABASE_URL="postgresql://encore:encore123@localhost:5432/encore_db"
NEXTAUTH_SECRET="dev-secret-key-not-for-production-use-only"
NEXTAUTH_URL="${NEXTAUTH_URL}"
ADMIN_PASSWORD="admin123"
CRON_SECRET="dev-secret-change-in-production"
MARKET_TICK_SCHEDULE="*/5 * * * *"
EOF
    echo "✅ .env created"
else
    echo "✅ .env already exists"
fi
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install
echo "✅ Dependencies installed"
echo ""

# Start PostgreSQL
echo "🐘 Starting PostgreSQL..."
docker compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker compose exec -T postgres pg_isready -U encore -d encore_db &> /dev/null; do
    echo "   Still waiting..."
    sleep 2
done
echo "✅ PostgreSQL is ready"
echo ""

# Set up database schema (using docker exec — no local psql needed)
echo "🗄️  Setting up database schema..."
docker exec -i encore-postgres psql -U encore -d encore_db < db/schema.sql
echo "✅ Schema applied"
echo ""

# Seed database
echo "🌱 Seeding database..."
pnpm seed
echo "✅ Database seeded"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "📝 Demo credentials:"
echo "   demo / demo123"
echo "   trader1 / trader123"
echo "   musicfan / music123"
echo ""
echo "🚀 Run: pnpm dev"
echo "   Then open: ${NEXTAUTH_URL}"
