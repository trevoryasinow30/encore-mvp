import 'dotenv/config';
import cron from 'node-cron';
import { prisma } from './lib/prisma';
import { getMarketStats, runMarketTick } from './lib/market-tick';
import { ensureLastfmSchema } from './lib/lastfm-schema';
import { hasLastfmApiKey, syncLastfmMarketData } from './lib/lastfm-market';

console.log('🚀 Starting Encore market automation service...\n');

const marketTickSchedule = process.env.MARKET_TICK_SCHEDULE || '*/5 * * * *';
const lastfmSyncSchedule = process.env.LASTFM_SYNC_SCHEDULE || '15 * * * *';

console.log(`⏰ Market tick schedule: ${marketTickSchedule}`);
if (hasLastfmApiKey()) {
  console.log(`📻 Last.fm sync schedule: ${lastfmSyncSchedule}`);
}
console.log('');

async function logMarketSummary(prefix: string, updatedSongs: Awaited<ReturnType<typeof runMarketTick>>) {
  const stats = await getMarketStats();

  console.log(`\n✅ ${prefix}`);
  console.log(`   Songs updated: ${updatedSongs.length}`);
  console.log(`   Total listening delta: ${Math.round(stats.totalVolume).toLocaleString()}`);
  console.log(`   Average price: $${stats.avgPrice.toFixed(2)}`);

  if (stats.topMovers.length > 0) {
    console.log(`\n📈 Top movers:`);
    stats.topMovers.slice(0, 3).forEach((mover) => {
      const emoji = mover.change24hPct >= 0 ? '📈' : '📉';
      console.log(
        `   ${emoji} ${mover.change24hPct >= 0 ? '+' : ''}${mover.change24hPct.toFixed(2)}%`
      );
    });
  }
}

async function syncLastfmAndReprice(reason: string) {
  if (!hasLastfmApiKey()) {
    return;
  }

  console.log(`\n📻 ${reason}`);
  const result = await syncLastfmMarketData();
  console.log(`   Songs synced: ${result.syncedSongs}`);
  console.log(`   Missing Last.fm matches: ${result.missingSongs}`);
  console.log(`   Prices initialized from Last.fm: ${result.initializedPrices}`);

  const updatedSongs = await runMarketTick();
  await logMarketSummary('Market repriced from Last.fm data', updatedSongs);
}

cron.schedule(marketTickSchedule, async () => {
  try {
    const now = new Date();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 Automated Market Tick - ${now.toLocaleString()}`);
    console.log('='.repeat(60));

    const updatedSongs = await runMarketTick();
    await logMarketSummary('Market tick completed successfully!', updatedSongs);

    console.log(`\n⏰ Next tick in 5 minutes`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Error during market tick:', error);
    console.log(`⏰ Will retry on schedule`);
    console.log('='.repeat(60));
  }
});

if (hasLastfmApiKey()) {
  cron.schedule(lastfmSyncSchedule, async () => {
    try {
      await syncLastfmAndReprice(`Scheduled Last.fm refresh - ${new Date().toLocaleString()}`);
    } catch (error) {
      console.error('\n❌ Error during Last.fm refresh:', error);
    }
  });
}

async function startAutomation() {
  await ensureLastfmSchema();

  if (!hasLastfmApiKey()) {
    console.log('ℹ️  LASTFM_API_KEY is not set. Running in demo pricing mode.\n');
  }

  const existingMetricCount = await prisma.lastfmMetric.count();

  if (existingMetricCount > 0 || !hasLastfmApiKey()) {
    console.log('🔄 Running initial market tick...\n');

    try {
      const updatedSongs = await runMarketTick();
      await logMarketSummary('Initial market tick completed!', updatedSongs);
      console.log(`\n⏰ Automated updates are running.`);
      console.log('   Press Ctrl+C to stop\n');
    } catch (error) {
      console.error('❌ Error during initial market tick:', error);
      console.log('⏰ Will continue with scheduled updates...\n');
    }
    return;
  }

  console.log('📻 No cached Last.fm data yet. Starting background sync...\n');

  void syncLastfmAndReprice('Initial Last.fm sync')
    .then(() => {
      console.log(`\n⏰ Automated updates are running.`);
      console.log('   Press Ctrl+C to stop\n');
    })
    .catch((error) => {
      console.error('❌ Error during initial Last.fm sync:', error);
      console.log('⏰ Falling back to scheduled market ticks...\n');
    });
}

void startAutomation();

process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping market automation service...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Stopping market automation service...');
  process.exit(0);
});
