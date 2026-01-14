#!/bin/bash

echo "🎵 Starting Encore MVP..."
echo ""

# Check if database is running
if ! docker compose ps | grep -q "postgres.*running"; then
    echo "📦 Starting PostgreSQL..."
    docker compose up -d

    echo "⏳ Waiting for database to be ready..."
    sleep 3
fi

# Check if Prisma client exists
if [ ! -d "node_modules/.prisma" ]; then
    echo "⚠️  Prisma client not found. Run ./setup.sh first!"
    exit 1
fi

echo "✅ Database is running"
echo ""
echo "🚀 Starting development server..."
echo ""
echo "   Open: http://localhost:3000"
echo "   Demo login: demo / demo123"
echo ""

pnpm dev
