# Encore MVP

A fantasy "song market" where users trade positions in songs based on cultural momentum. No ownership, no royalties, no real money payouts—pure speculation on music's cultural trajectory.

## Core Features

1. **Browse Markets** - Explore songs across multiple categories (Top Movers, Re-Emerging Classics, Covers, Trending)
2. **Song Market Pages** - View price charts, execute trades, see "Why it's moving" signals, and recent trade activity
3. **Portfolio** - Track holdings, unrealized P&L, and total equity
4. **Leaderboard** - Compete with other traders ranked by total equity
5. **Market Signals** - Algorithmic tags explaining price movements (TikTok spikes, re-emergence, etc.)
6. **External Pricing Anchor** - Cached Last.fm listening data can be used to ground prices before user trading activity exists

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, PostgreSQL via `pg` and Prisma
- **Database**: PostgreSQL (via Docker)
- **Authentication**: NextAuth.js (credentials provider)
- **Charts**: Recharts

## Quick Start

### Easiest local path

Prerequisites: Node.js 18+, pnpm, Docker Desktop

```bash
./start.sh
```

That command handles first-run setup automatically, starts PostgreSQL, applies the schema, seeds demo data, and launches the Next.js dev server.

Open [http://localhost:3000](http://localhost:3000)

### Bootstrap without starting the server

If you only want to provision the app once and start it yourself later:

```bash
bash setup.sh
pnpm dev
```

### GitHub Codespaces

Open the repo in a Codespace and run:

```bash
./start.sh
```

### Demo credentials

```
demo / demo123
trader1 / trader123
musicfan / music123
```

Each account starts with $10,000 in fantasy currency.

## Key Endpoints

- `/` - Home (Markets browse)
- `/song/[id]` - Song market page with trading
- `/portfolio` - User portfolio and P&L
- `/leaderboard` - User rankings
- `/admin` - Admin panel (password: `admin123`)
- `/auth/signin` - Sign in page

## How It Works

### Trading Mechanics

- **Fantasy Currency**: Users start with $10,000 (no real money)
- **Fractional Shares**: Trade quantities like 0.01 shares
- **Market Orders**: Trades execute at current market price
- **Position Tracking**: Automatic calculation of avg cost, P&L, and equity

### Market Pricing Engine

Located in `lib/market-tick.ts`:

```typescript
// Key parameters (adjust in market-tick.ts)
LIQUIDITY_CONSTANT = 10000  // Higher = less volatile
MAX_STEP = 0.15             // Max 15% price change per tick
MIN_PRICE = 0.05            // Price floor at $0.05
LOOKBACK_MINUTES = 60       // Analyze last 60 min of trades
```

**How Prices Move**:

1. Sync Last.fm playcounts and listener counts into a local cache
2. Rank the tracked songs by a weighted listening score derived from playcount and listeners
3. Map that rank into the local price band
4. If users have traded a song recently, apply a bounded in-app impact around the Last.fm anchor
5. If Last.fm data is not configured yet, the repo falls back to demo pricing behavior

**Running Market Tick**:

- **Manual**: Use the Admin panel → "Run Market Tick Now" button
- **Automated**: `./start.sh` runs the local market automation alongside Next.js
- **Last.fm sync**: Run `pnpm lastfm:sync` after setting `LASTFM_API_KEY`
- **Metadata sync**: Run `pnpm spotify:sync` after setting `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`

Example cron (every 3 minutes):

```bash
*/3 * * * * curl -X POST http://localhost:3000/api/admin/market-tick \
  -H "Content-Type: application/json" \
  -d '{"password":"admin123"}'
```

### Signal Engine

Located in `lib/signals.ts`:

Generates tags from cached Last.fm metrics and price movement:

- **LASTFM_LEADER**: High absolute listening volume inside the tracked catalog
- **LISTENING_MOMENTUM**: Recent playcount growth is strong versus peers
- **RE-EMERGING**: Older songs with fresh listening momentum
- **HOT_COVER**: Covers with meaningful listening growth

**Tag Generation Rules**:

- `LASTFM_LEADER`: top listening percentile in the tracked catalog
- `LISTENING_MOMENTUM`: top recent playcount-delta percentile
- `TOP_MOVER`: 24h price change > +10%
- `HOT_COVER`: cover version with meaningful listening momentum

## Project Structure

```
encore-mvp/
├── .devcontainer/
│   └── devcontainer.json   # Codespaces config (auto-setup)
├── app/
│   ├── api/                # API routes
│   │   ├── auth/           # NextAuth handlers
│   │   ├── trade/          # Trade execution
│   │   ├── portfolio/      # Portfolio data
│   │   └── admin/          # Admin operations
│   ├── auth/signin/        # Sign-in page
│   ├── song/[id]/          # Song market page
│   ├── portfolio/          # Portfolio page
│   ├── leaderboard/        # Leaderboard page
│   ├── admin/              # Admin panel
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Navigation.tsx
│   └── TradeModule.tsx
├── docs/
│   └── market-data.md      # Pricing-source decisions and transparency notes
├── db/
│   └── schema.sql          # Database schema
├── lib/
│   ├── auth.ts             # NextAuth config
│   ├── lastfm-market.ts    # Last.fm sync + price-anchor logic
│   ├── trading.ts          # Trade execution logic
│   ├── market-tick.ts      # Pricing engine
│   └── signals.ts          # Signal/tag generation
├── prisma/
│   ├── schema.prisma
│   └── seed.ts             # Seed script
├── scripts/
│   └── setup-db.ts         # Apply db/schema.sql
├── docker-compose.yml      # PostgreSQL setup
├── setup.sh                # One-command setup script
├── start.sh                # One-command bootstrap + dev script
└── package.json
```

## Database Schema

**User** - id, username, email, password (hashed)

**Song** - id, title, artistName, isCover, releaseYear, spotifyTrackId, appleMusicId, youtubeId

**LastfmMetric** (one per song when synced) - playcount, listeners, playcountDelta, syncedAt

**MarketState** (one per song) - price, change24hPct, volume24h, traders24h, tags

**Trade** - userId, songId, side (BUY/SELL), qty, price, total

**Position** (one per user per song) - userId, songId, qty, avgCost

**Ledger** (cash transactions) - userId, type (DEPOSIT/TRADE/ADJUST), amount, balanceAfter

## Development Scripts

```bash
# Development
./start.sh            # First-run friendly local entry point
pnpm dev              # Start dev server
pnpm dev:with-cron    # Start dev server plus local market automation
pnpm build            # Production build
pnpm start            # Production server
pnpm lint             # Run ESLint

# Database
pnpm db:setup         # Apply schema from db/schema.sql
pnpm db:ensure-lastfm # Create the Last.fm metrics table on an existing database
pnpm prisma:generate  # Generate Prisma client
pnpm seed             # Seed database with songs and users

# External data
pnpm lastfm:sync      # Sync Last.fm playcounts/listeners and initialize prices
pnpm spotify:sync     # Backfill Spotify track IDs and artwork

# Docker
docker compose up -d         # Start PostgreSQL
docker compose down          # Stop PostgreSQL
docker compose logs -f       # View logs
```

## Configuration & Tuning

### Market Parameters

Edit `lib/market-tick.ts`:

```typescript
const LIQUIDITY_CONSTANT = 10000;  // Higher = more stable prices
const MAX_STEP = 0.15;             // Cap price swings at 15% per tick
const MIN_PRICE = 0.05;            // Don't allow prices below $0.05
const LOOKBACK_MINUTES = 60;       // Window for trade analysis
```

### Signal Thresholds

Edit `lib/signals.ts`:

```typescript
if (popularityPercentile >= 0.85) tags.push('LASTFM_LEADER');
if (momentumPercentile >= 0.85) tags.push('LISTENING_MOMENTUM');
```

### Starting Balance

Edit `prisma/seed.ts` and change the deposit amount (default: `10000`).

## API Routes

### Trading

**POST /api/trade**
- Body: `{ songId, side: "BUY" | "SELL", qty }`
- Auth: Required (NextAuth session)

**GET /api/portfolio**
- Auth: Required
- Returns: `{ balance, positions[], totalMarketValue, totalEquity }`

### Admin

**POST /api/admin/market-tick**
- Body: `{ password }`
- Returns: `{ success, updatedCount, results[] }`

**GET /api/admin/stats**
- Returns: `{ totalSongs, totalVolume, avgPrice, topMovers[] }`

## Production Deployment

Update `.env`:

```env
DATABASE_URL="postgresql://user:password@host:5432/db"
NEXTAUTH_SECRET="<generate-with: openssl rand -base64 32>"
NEXTAUTH_URL="https://yourdomain.com"
ADMIN_PASSWORD="<secure-password>"
```

Apply schema and seed on first deploy:

```bash
pnpm prisma:generate
pnpm db:setup
pnpm seed
```

Set up a scheduled job to run market ticks every 1-5 minutes:

```bash
curl -X POST https://yourdomain.com/api/admin/market-tick \
  -H "Content-Type: application/json" \
  -d '{"password":"your-admin-password"}'
```

## Troubleshooting

### Database connection fails

Verify PostgreSQL is running:
```bash
docker compose ps
docker compose logs postgres
```

If this is a brand-new clone, run:
```bash
./start.sh
```

### Port already in use

If port 3000 is taken:
```bash
PORT=3001 pnpm dev
```

If port 5432 is taken:
- Stop existing PostgreSQL: `sudo systemctl stop postgresql`
- Or change the port in `docker-compose.yml` and `DATABASE_URL`

### Codespace NEXTAUTH_URL mismatch

If you see auth errors in Codespaces, make sure `NEXTAUTH_URL` in `.env` matches your forwarded port 3000 URL. Re-run `setup.sh` to regenerate it automatically.

## Known Limitations (MVP)

- No real-time price updates (requires polling or WebSockets)
- No user registration flow (users are pre-seeded)
- Signals are simulated (integrate real APIs for production)
- No transaction history view
- Market orders only (no limit orders or stop-loss)

## Roadmap (Post-MVP)

- [ ] Real-time price updates via WebSockets
- [ ] Historical price charts with Recharts
- [ ] User registration and profile pages
- [ ] Integration with Spotify/TikTok/YouTube APIs
- [ ] Advanced order types (limit orders, stop-loss)
- [ ] Portfolio history and equity curve
- [ ] Social features (comments, follows)
- [ ] Mobile app

## License

MIT
