# 🚀 Quick Start Guide

## Prerequisites

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **Docker Desktop** installed and running ([Download](https://www.docker.com/products/docker-desktop))
- **Git** installed

## One-Command Setup

Run this in your terminal:

```bash
./setup.sh
```

This will:
1. ✅ Start PostgreSQL database
2. ✅ Install all dependencies
3. ✅ Generate Prisma client
4. ✅ Create database schema
5. ✅ Seed with 80+ songs and demo users

## Start the App

```bash
pnpm dev
```

Open **http://localhost:3000**

## Sign In

```
Username: demo
Password: demo123
```

## What to Try

1. **Browse Markets** - See trending songs, re-emerging classics, hot covers
2. **Click a Song** - View price and execute buy/sell trades
3. **Check Portfolio** - See your positions and P&L
4. **View Leaderboard** - Compare your performance
5. **Run Market Tick** - Go to Admin panel and click "Run Market Tick Now" to update all prices

## Demo Users

- `demo` / `demo123` - Starting balance: $10,000
- `trader1` / `trader123` - Starting balance: $10,000
- `musicfan` / `music123` - Starting balance: $10,000

## Admin Panel

- URL: **http://localhost:3000/admin**
- Password: `admin123`
- Use it to manually run market ticks (updates all song prices)

## Manual Setup (if setup.sh doesn't work)

```bash
# 1. Start database
docker compose up -d

# 2. Install dependencies
pnpm install

# 3. Generate Prisma client
pnpm prisma generate

# 4. Create database schema
pnpm prisma migrate dev

# 5. Seed database
pnpm seed

# 6. Start dev server
pnpm dev
```

## Troubleshooting

**Port 3000 already in use?**
```bash
PORT=3001 pnpm dev
```

**Prisma engine download fails?**
```bash
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 pnpm install
```

**Database connection error?**
```bash
# Check if PostgreSQL is running
docker compose ps

# Restart if needed
docker compose restart
```

## Need Help?

Check the full **README.md** for detailed documentation.
