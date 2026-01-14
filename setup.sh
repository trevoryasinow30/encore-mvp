#!/bin/bash
set -e

echo "🎵 Setting up Encore MVP..."
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm not found. Installing pnpm globally..."
    npm install -g pnpm
fi

echo "✅ Prerequisites OK"
echo ""

# Step 1: Start PostgreSQL
echo "🐘 Starting PostgreSQL with Docker Compose..."
docker compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if database is ready
until docker compose exec -T postgres pg_isready -U encore -d encore_db &> /dev/null; do
    echo "   Still waiting for database..."
    sleep 2
done

echo "✅ PostgreSQL is ready"
echo ""

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
pnpm install

echo "✅ Dependencies installed"
echo ""

# Step 3: Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm prisma generate

echo "✅ Prisma client generated"
echo ""

# Step 4: Run migrations
echo "🗄️  Running database migrations..."
pnpm prisma migrate dev --name init

echo "✅ Migrations completed"
echo ""

# Step 5: Seed database
echo "🌱 Seeding database with songs and users..."
pnpm seed

echo "✅ Database seeded"
echo ""

# Done!
echo "🎉 Setup complete!"
echo ""
echo "📝 Demo credentials:"
echo "   Username: demo"
echo "   Password: demo123"
echo ""
echo "🚀 Start the development server with:"
echo "   pnpm dev"
echo ""
echo "Then open http://localhost:3000 in your browser!"
