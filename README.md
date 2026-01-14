# Encore MVP

A fantasy "song market" where users trade positions in songs based on cultural momentum. No ownership, no royalties, no real money payouts—pure speculation on music's cultural trajectory.

## Core Features

1. **Browse Markets** - Explore songs across multiple categories (Top Movers, Re-Emerging Classics, Covers, Trending)
2. **Song Market Pages** - View price charts, execute trades, see "Why it's moving" signals, and recent trade activity
3. **Portfolio** - Track holdings, unrealized P&L, and total equity
4. **Leaderboard** - Compete with other traders ranked by total equity
5. **Market Signals** - Algorithmic tags explaining price movements (TikTok spikes, re-emergence, etc.)

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js (credentials provider)
- **Charts**: Recharts (ready to implement)

## Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose (for PostgreSQL)
- Git

## Quick Start

### 1. Clone and Install

```bash
cd encore-mvp
pnpm install
```

### 2. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

The default `.env` should work for local development:

```env
DATABASE_URL="postgresql://encore:encore123@localhost:5432/encore_db?schema=public"
NEXTAUTH_SECRET="dev-secret-key-not-for-production-use-only"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_PASSWORD="admin123"
```

### 3. Start PostgreSQL

```bash
docker compose up -d
```

This starts a PostgreSQL database on `localhost:5432`.

### 4. Database Setup

Generate Prisma client:

```bash
pnpm prisma generate
```

If this fails due to network issues with Prisma binaries, try:

```bash
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 pnpm prisma generate
```

Run migrations to create database schema:

```bash
pnpm prisma:migrate
```

Seed the database with songs and demo users:

```bash
pnpm seed
```

This creates:
- 80+ songs (mix of classics, recent hits, and covers)
- 3 demo users with $10,000 starting balance each
- Initial market states (all songs start at $1.00)

### 5. Start Development Server

```bash
pnpm dev
```

Navigate to [http://localhost:3000](http://localhost:3000)

### 6. Sign In

Use the demo credentials:

```
Username: demo
Password: demo123
```

Other demo users: `trader1` / `trader123`, `musicfan` / `music123`

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

1. Calculate net order imbalance: `buyNotional - sellNotional`
2. Compute price impact: `clamp(net / LIQUIDITY_CONSTANT, -MAX_STEP, +MAX_STEP)`
3. Apply to current price: `newPrice = oldPrice * (1 + impact)`
4. Enforce minimum price floor
5. Songs with no trades get small random walk (±1%) to keep interesting

**Running Market Tick**:

- **Manual**: Use the Admin panel → "Run Market Tick Now" button
- **Automated**: Set up a cron job to POST to `/api/admin/market-tick` every 1-5 minutes

Example cron (every 3 minutes):

```bash
*/3 * * * * curl -X POST http://localhost:3000/api/admin/market-tick \
  -H "Content-Type: application/json" \
  -d '{"password":"admin123"}'
```

### Signal Engine

Located in `lib/signals.ts`:

Generates deterministic but time-varying signals for each song:

- **TikTok Velocity**: Simulated viral momentum
- **Spotify Popularity Delta**: Chart movement
- **YouTube Views Delta**: Video engagement
- **Social Mentions Trend**: Buzz tracking

**Tag Generation Rules** (in `generateTags`):

- `RE-EMERGING`: Song age >= 5 years + TikTok velocity > 0.3
- `TIKTOK_SPIKE`: TikTok velocity > 0.4
- `SPOTIFY_MOMENTUM`: Spotify delta > 0.3
- `TOP_MOVER`: 24h price change > +20%
- `HOT_COVER`: Cover version + social buzz

Signals update every 30 minutes (deterministic seed based on time).

## Project Structure

```
encore-mvp/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth handlers
│   │   ├── trade/        # Trade execution
│   │   ├── portfolio/    # Portfolio data
│   │   └── admin/        # Admin operations
│   ├── auth/signin/      # Sign-in page
│   ├── song/[id]/        # Song market page
│   ├── portfolio/        # Portfolio page
│   ├── leaderboard/      # Leaderboard page
│   ├── admin/            # Admin panel
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/
│   ├── Navigation.tsx    # Nav bar
│   └── TradeModule.tsx   # Buy/sell widget
├── lib/
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # NextAuth config
│   ├── trading.ts        # Trade execution logic
│   ├── market-tick.ts    # Pricing engine
│   └── signals.ts        # Signal/tag generation
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
├── docker-compose.yml    # PostgreSQL setup
├── package.json
└── README.md
```

## Database Schema

**User**
- id, username, email, password (hashed)

**Song**
- id, title, artistName, isCover, releaseYear
- spotifyTrackId, appleMusicId, youtubeId (optional)

**MarketState** (one per song)
- price, change24hPct, volume24h, traders24h
- tags (array of strings)

**Trade**
- userId, songId, side (BUY/SELL), qty, price, total

**Position** (one per user per song)
- userId, songId, qty, avgCost

**Ledger** (cash transactions)
- userId, type (DEPOSIT/TRADE/ADJUST), amount, balanceAfter

## Configuration & Tuning

### Market Parameters

Edit `lib/market-tick.ts`:

```typescript
const LIQUIDITY_CONSTANT = 10000;  // Higher = more stable prices
const MAX_STEP = 0.15;              // Cap price swings at 15% per tick
const MIN_PRICE = 0.05;             // Don't allow prices below $0.05
const LOOKBACK_MINUTES = 60;        // Window for trade analysis
```

### Signal Thresholds

Edit `lib/signals.ts`:

```typescript
// In generateTags function
if (signals.tiktokVelocity > 0.4) tags.push('TIKTOK_SPIKE');  // Adjust threshold
if (change24hPct > 20) tags.push('TOP_MOVER');                // Adjust % threshold
```

### Starting Balance

Edit `prisma/seed.ts`:

```typescript
await prisma.ledger.create({
  data: {
    userId: user.id,
    type: 'DEPOSIT',
    amount: 10000,  // Change starting balance here
    balanceAfter: 10000,
  },
});
```

## Development Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm start            # Production server
pnpm lint             # Run ESLint

# Database
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:migrate   # Run migrations (creates schema)
pnpm prisma:studio    # Open Prisma Studio (DB GUI)
pnpm seed             # Seed database

# Docker
docker compose up -d         # Start PostgreSQL
docker compose down          # Stop PostgreSQL
docker compose logs -f       # View logs
```

## API Routes

### Trading

**POST /api/trade**
- Body: `{ songId, side: "BUY" | "SELL", qty }`
- Auth: Required (NextAuth session)
- Returns: Trade record

**GET /api/portfolio**
- Auth: Required
- Returns: `{ balance, positions[], totalMarketValue, totalEquity }`

### Admin

**POST /api/admin/market-tick**
- Body: `{ password }`
- Returns: `{ success, updatedCount, results[] }`

**GET /api/admin/stats**
- Returns: `{ totalSongs, totalVolume, avgPrice, topMovers[] }`

## Testing

### Manual Testing Checklist

1. ✅ Sign in with demo credentials
2. ✅ Browse markets on home page
3. ✅ Click into a song market page
4. ✅ Execute a BUY trade
5. ✅ Check portfolio shows position
6. ✅ Execute a SELL trade
7. ✅ Verify balance updates correctly
8. ✅ Check leaderboard rankings
9. ✅ Run market tick from admin panel
10. ✅ Verify prices update

### Trade Execution Tests

Verify these scenarios work:

- ✅ Buy with sufficient funds
- ✅ Buy with insufficient funds (error)
- ✅ Sell with sufficient shares
- ✅ Sell with insufficient shares (error)
- ✅ Fractional quantities (e.g., 0.5 shares)
- ✅ Position average cost calculation
- ✅ P&L calculation accuracy

## Production Deployment

### Environment Variables

Update `.env` for production:

```env
DATABASE_URL="postgresql://user:password@host:5432/db"
NEXTAUTH_SECRET="<generate-random-secret>"
NEXTAUTH_URL="https://yourdomain.com"
ADMIN_PASSWORD="<secure-password>"
```

Generate secret:
```bash
openssl rand -base64 32
```

### Database Migration

```bash
pnpm prisma migrate deploy  # Run migrations in production
```

### Market Tick Automation

Set up a scheduled job (cron, GitHub Actions, Vercel Cron, etc.) to call:

```bash
curl -X POST https://yourdomain.com/api/admin/market-tick \
  -H "Content-Type: application/json" \
  -d '{"password":"your-admin-password"}'
```

Run every 1-5 minutes for active price movement.

## Known Limitations (MVP)

- No real-time price updates (requires polling or WebSockets)
- Price charts are placeholders (implement with Recharts + historical data)
- No user registration flow (users are pre-seeded)
- Signals are mock/simulated (integrate real APIs for production)
- No transaction history view
- No order types (market orders only)
- No price limits or circuit breakers

## Roadmap (Post-MVP)

- [ ] Real-time price updates via WebSockets
- [ ] Historical price charts with Recharts
- [ ] User registration and profile pages
- [ ] Integration with Spotify/TikTok/YouTube APIs
- [ ] Advanced order types (limit orders, stop-loss)
- [ ] Portfolio history and equity curve
- [ ] Social features (comments, follows)
- [ ] Mobile app
- [ ] Advanced analytics dashboard

## Troubleshooting

### Prisma Client Generation Fails

If you see "403 Forbidden" when downloading Prisma engines:

```bash
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 pnpm install
```

### Database Connection Issues

Verify PostgreSQL is running:
```bash
docker compose ps
```

Test connection:
```bash
psql postgresql://encore:encore123@localhost:5432/encore_db
```

### Port Already in Use

If port 3000 is taken:
```bash
PORT=3001 pnpm dev
```

If port 5432 is taken (PostgreSQL):
- Stop existing PostgreSQL: `sudo systemctl stop postgresql`
- Or change port in `docker-compose.yml` and `DATABASE_URL`

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
