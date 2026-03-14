# 🚀 Quick Start Guide

## Prerequisites

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **Docker Desktop** installed and running ([Download](https://www.docker.com/products/docker-desktop))
- **Git** installed

## One-Command Start

Run this in your terminal:

```bash
./start.sh
```

This will:
1. ✅ Start PostgreSQL database
2. ✅ Install all dependencies
3. ✅ Generate Prisma client
4. ✅ Create database schema
5. ✅ Seed with 80+ songs and demo users
6. ✅ Launch the local dev server and local market automation

Open **http://localhost:3000**

## Bootstrap Only

```bash
bash setup.sh
```

## Last.fm Pricing Sync

If you want prices to be anchored to real listening data, add `LASTFM_API_KEY` to `.env`.
Then either start the app normally:

```bash
./start.sh
```

or run the sync manually:

```bash
pnpm lastfm:sync
```

The local automation uses cached Last.fm playcounts and listeners for pricing. Without a
Last.fm API key, the app stays in demo pricing mode.

## Spotify Metadata Sync

If you want to backfill Spotify track IDs and artwork for songs,
add `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` to `.env`, then run:

```bash
pnpm spotify:sync
```

This is optional and does not control pricing.

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
- Use it to manually run market ticks.

## Manual Setup (if setup.sh doesn't work)

```bash
# 1. Start database
docker compose up -d postgres

# 2. Install dependencies
pnpm install

# 3. Generate Prisma client
pnpm prisma:generate

# 4. Create database schema
pnpm db:setup

# 4b. Ensure the Last.fm metrics table exists
pnpm db:ensure-lastfm

# 5. Seed database
pnpm seed

# 6. Start dev server
pnpm dev:with-cron
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

Check the full **README.md** and **docs/market-data.md** for detailed documentation.
