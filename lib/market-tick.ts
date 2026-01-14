import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { generateSignals, generateTags } from '@/lib/signals';

// Market configuration
const LIQUIDITY_CONSTANT = 10000; // Higher = less volatile
const MAX_STEP = 0.15; // Max 15% price change per tick
const MIN_PRICE = 0.05; // Minimum price is $0.05
const LOOKBACK_MINUTES = 60; // Look at last 60 minutes of trades

export async function runMarketTick() {
  console.log('🔄 Running market tick...');

  const songs = await prisma.song.findMany({
    include: {
      marketState: true,
      trades: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - LOOKBACK_MINUTES * 60 * 1000),
          },
        },
      },
    },
  });

  const updatePromises = songs.map(async (song) => {
    const oldPrice = song.marketState?.price
      ? Number(song.marketState.price)
      : 1.0;

    // Calculate net order imbalance
    const buyTrades = song.trades.filter((t) => t.side === 'BUY');
    const sellTrades = song.trades.filter((t) => t.side === 'SELL');

    const buyNotional = buyTrades.reduce((sum, t) => sum + Number(t.total), 0);
    const sellNotional = sellTrades.reduce((sum, t) => sum + Number(t.total), 0);

    const net = buyNotional - sellNotional;

    // Calculate impact (clamped to max step)
    const impact = Math.max(
      -MAX_STEP,
      Math.min(MAX_STEP, net / LIQUIDITY_CONSTANT)
    );

    // Apply impact to price
    let newPrice = oldPrice * (1 + impact);

    // Add some random walk for songs with no trades (to keep it interesting)
    if (song.trades.length === 0) {
      const randomWalk = (Math.random() - 0.5) * 0.02; // ±1% random movement
      newPrice = oldPrice * (1 + randomWalk);
    }

    // Enforce minimum price
    newPrice = Math.max(MIN_PRICE, newPrice);

    // Calculate 24h change
    const change24hPct = ((newPrice - oldPrice) / oldPrice) * 100;

    // Calculate volume and unique traders
    const volume24h = buyNotional + sellNotional;
    const uniqueTraders = new Set(song.trades.map((t) => t.userId)).size;

    // Generate signals and tags
    const signals = generateSignals(song.id, song.releaseYear);
    const tags = generateTags(signals, change24hPct, song.releaseYear, song.isCover);

    // Update or create market state
    if (song.marketState) {
      await prisma.marketState.update({
        where: { id: song.marketState.id },
        data: {
          price: new Decimal(newPrice.toFixed(2)),
          change24hPct: new Decimal(change24hPct.toFixed(2)),
          volume24h: new Decimal(volume24h.toFixed(2)),
          traders24h: uniqueTraders,
          tags,
          lastUpdatedAt: new Date(),
        },
      });
    } else {
      await prisma.marketState.create({
        data: {
          songId: song.id,
          price: new Decimal(newPrice.toFixed(2)),
          change24hPct: new Decimal(change24hPct.toFixed(2)),
          volume24h: new Decimal(volume24h.toFixed(2)),
          traders24h: uniqueTraders,
          tags,
        },
      });
    }

    // Save price history snapshot
    await prisma.priceHistory.create({
      data: {
        songId: song.id,
        price: new Decimal(newPrice.toFixed(2)),
        volume: new Decimal(volume24h.toFixed(2)),
      },
    });

    return {
      songId: song.id,
      title: song.title,
      oldPrice,
      newPrice,
      change24hPct,
      tags,
    };
  });

  const results = await Promise.all(updatePromises);

  console.log(`✅ Market tick completed. Updated ${results.length} songs.`);

  return results;
}

// Function to get market stats
export async function getMarketStats() {
  const totalSongs = await prisma.song.count();

  const marketStates = await prisma.marketState.findMany();

  const topMovers = marketStates
    .sort((a, b) => Number(b.change24hPct) - Number(a.change24hPct))
    .slice(0, 10);

  const totalVolume = marketStates.reduce(
    (sum, ms) => sum + Number(ms.volume24h),
    0
  );

  const avgPrice =
    marketStates.reduce((sum, ms) => sum + Number(ms.price), 0) /
    marketStates.length;

  return {
    totalSongs,
    totalVolume,
    avgPrice,
    topMovers: topMovers.map((ms) => ({
      songId: ms.songId,
      price: Number(ms.price),
      change24hPct: Number(ms.change24hPct),
    })),
  };
}
