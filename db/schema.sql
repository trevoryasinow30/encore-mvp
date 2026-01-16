-- Encore MVP Database Schema
-- PostgreSQL version

-- Drop existing tables (for clean setup)
DROP TABLE IF EXISTS "UserSettings" CASCADE;
DROP TABLE IF EXISTS "LimitOrder" CASCADE;
DROP TABLE IF EXISTS "PriceAlert" CASCADE;
DROP TABLE IF EXISTS "Watchlist" CASCADE;
DROP TABLE IF EXISTS "PriceHistory" CASCADE;
DROP TABLE IF EXISTS "Ledger" CASCADE;
DROP TABLE IF EXISTS "Position" CASCADE;
DROP TABLE IF EXISTS "Trade" CASCADE;
DROP TABLE IF EXISTS "MarketState" CASCADE;
DROP TABLE IF EXISTS "Song" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS "OrderStatus" CASCADE;
DROP TYPE IF EXISTS "AlertType" CASCADE;
DROP TYPE IF EXISTS "LedgerType" CASCADE;
DROP TYPE IF EXISTS "TradeSide" CASCADE;

-- Create enums
CREATE TYPE "TradeSide" AS ENUM ('BUY', 'SELL');
CREATE TYPE "LedgerType" AS ENUM ('DEPOSIT', 'TRADE', 'ADJUST');
CREATE TYPE "AlertType" AS ENUM ('PRICE_ABOVE', 'PRICE_BELOW', 'CHANGE_PERCENT');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'FILLED', 'CANCELLED', 'EXPIRED');

-- User table
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "username" TEXT UNIQUE NOT NULL,
  "email" TEXT UNIQUE,
  "password" TEXT,
  "bio" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "User_username_idx" ON "User"("username");

-- Song table
CREATE TABLE "Song" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "artistName" TEXT NOT NULL,
  "isCover" BOOLEAN NOT NULL DEFAULT false,
  "releaseYear" INTEGER,
  "spotifyTrackId" TEXT,
  "appleMusicId" TEXT,
  "youtubeId" TEXT,
  "albumImageUrl" TEXT,
  "artistImageUrl" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Song_title_idx" ON "Song"("title");
CREATE INDEX "Song_artistName_idx" ON "Song"("artistName");
CREATE INDEX "Song_isCover_idx" ON "Song"("isCover");
CREATE INDEX "Song_releaseYear_idx" ON "Song"("releaseYear");

-- MarketState table
CREATE TABLE "MarketState" (
  "id" TEXT PRIMARY KEY,
  "songId" TEXT UNIQUE NOT NULL,
  "price" DECIMAL(10, 2) NOT NULL,
  "change24hPct" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "volume24h" DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "traders24h" INTEGER NOT NULL DEFAULT 0,
  "tags" TEXT[] NOT NULL DEFAULT '{}',
  "lastUpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketState_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE
);

CREATE INDEX "MarketState_price_idx" ON "MarketState"("price");
CREATE INDEX "MarketState_change24hPct_idx" ON "MarketState"("change24hPct");
CREATE INDEX "MarketState_volume24h_idx" ON "MarketState"("volume24h");

-- Trade table
CREATE TABLE "Trade" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "songId" TEXT NOT NULL,
  "side" "TradeSide" NOT NULL,
  "qty" DECIMAL(15, 4) NOT NULL,
  "price" DECIMAL(10, 2) NOT NULL,
  "total" DECIMAL(15, 2) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id"),
  CONSTRAINT "Trade_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id")
);

CREATE INDEX "Trade_userId_idx" ON "Trade"("userId");
CREATE INDEX "Trade_songId_idx" ON "Trade"("songId");
CREATE INDEX "Trade_createdAt_idx" ON "Trade"("createdAt");

-- Position table
CREATE TABLE "Position" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "songId" TEXT NOT NULL,
  "qty" DECIMAL(15, 4) NOT NULL,
  "avgCost" DECIMAL(10, 2) NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Position_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id"),
  CONSTRAINT "Position_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id"),
  UNIQUE ("userId", "songId")
);

CREATE INDEX "Position_userId_idx" ON "Position"("userId");
CREATE INDEX "Position_songId_idx" ON "Position"("songId");

-- Ledger table
CREATE TABLE "Ledger" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" "LedgerType" NOT NULL,
  "amount" DECIMAL(15, 2) NOT NULL,
  "balanceAfter" DECIMAL(15, 2) NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Ledger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")
);

CREATE INDEX "Ledger_userId_idx" ON "Ledger"("userId");
CREATE INDEX "Ledger_createdAt_idx" ON "Ledger"("createdAt");

-- PriceHistory table
CREATE TABLE "PriceHistory" (
  "id" TEXT PRIMARY KEY,
  "songId" TEXT NOT NULL,
  "price" DECIMAL(10, 2) NOT NULL,
  "volume" DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PriceHistory_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE
);

CREATE INDEX "PriceHistory_songId_idx" ON "PriceHistory"("songId");
CREATE INDEX "PriceHistory_createdAt_idx" ON "PriceHistory"("createdAt");
CREATE INDEX "PriceHistory_songId_createdAt_idx" ON "PriceHistory"("songId", "createdAt");

-- Watchlist table
CREATE TABLE "Watchlist" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "songId" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Watchlist_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE,
  UNIQUE ("userId", "songId")
);

CREATE INDEX "Watchlist_userId_idx" ON "Watchlist"("userId");
CREATE INDEX "Watchlist_songId_idx" ON "Watchlist"("songId");

-- PriceAlert table
CREATE TABLE "PriceAlert" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "songId" TEXT NOT NULL,
  "type" "AlertType" NOT NULL,
  "targetValue" DECIMAL(10, 2) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "triggered" BOOLEAN NOT NULL DEFAULT false,
  "triggeredAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PriceAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "PriceAlert_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE
);

CREATE INDEX "PriceAlert_userId_idx" ON "PriceAlert"("userId");
CREATE INDEX "PriceAlert_songId_idx" ON "PriceAlert"("songId");
CREATE INDEX "PriceAlert_isActive_idx" ON "PriceAlert"("isActive");

-- LimitOrder table
CREATE TABLE "LimitOrder" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "songId" TEXT NOT NULL,
  "side" "TradeSide" NOT NULL,
  "qty" DECIMAL(15, 4) NOT NULL,
  "limitPrice" DECIMAL(10, 2) NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP,
  "filledAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LimitOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "LimitOrder_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE
);

CREATE INDEX "LimitOrder_userId_idx" ON "LimitOrder"("userId");
CREATE INDEX "LimitOrder_songId_idx" ON "LimitOrder"("songId");
CREATE INDEX "LimitOrder_status_idx" ON "LimitOrder"("status");

-- UserSettings table
CREATE TABLE "UserSettings" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE NOT NULL,
  "darkMode" BOOLEAN NOT NULL DEFAULT false,
  "emailAlerts" BOOLEAN NOT NULL DEFAULT true,
  "pushAlerts" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
