import cron from 'node-cron';
import { runMarketTick } from './lib/market-tick';

console.log('🚀 Starting Encore market automation service...\n');

// Run market tick every 5 minutes
// Cron format: minute hour day month weekday
// */5 * * * * = every 5 minutes
const schedule = process.env.MARKET_TICK_SCHEDULE || '*/5 * * * *';

console.log(`⏰ Schedule: Market will update every 5 minutes`);
console.log(`   Cron expression: ${schedule}`);
console.log(`   Next tick at: ${new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString()}\n`);

cron.schedule(schedule, async () => {
  try {
    const now = new Date();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 Automated Market Tick - ${now.toLocaleString()}`);
    console.log('='.repeat(60));

    const result = await runMarketTick();

    console.log(`\n✅ Market tick completed successfully!`);
    console.log(`   Songs updated: ${result.songsUpdated}`);
    console.log(`   Total volume: $${result.totalVolume.toFixed(2)}`);
    console.log(`   Average price: $${result.avgPrice.toFixed(2)}`);

    if (result.topMovers.length > 0) {
      console.log(`\n📈 Top movers:`);
      result.topMovers.slice(0, 3).forEach((mover) => {
        const emoji = mover.change24hPct >= 0 ? '📈' : '📉';
        console.log(`   ${emoji} ${mover.change24hPct >= 0 ? '+' : ''}${mover.change24hPct.toFixed(2)}%`);
      });
    }

    console.log(`\n⏰ Next tick at: ${new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString()}`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Error during market tick:', error);
    console.log(`⏰ Will retry at: ${new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString()}`);
    console.log('='.repeat(60));
  }
});

// Run immediately on startup
console.log('🔄 Running initial market tick...\n');
runMarketTick()
  .then((result) => {
    console.log(`\n✅ Initial market tick completed!`);
    console.log(`   Songs updated: ${result.songsUpdated}`);
    console.log(`   Total volume: $${result.totalVolume.toFixed(2)}`);
    console.log(`   Average price: $${result.avgPrice.toFixed(2)}`);
    console.log(`\n⏰ Automated updates running every 5 minutes...`);
    console.log('   Press Ctrl+C to stop\n');
  })
  .catch((error) => {
    console.error('❌ Error during initial market tick:', error);
    console.log('⏰ Will continue with scheduled updates...\n');
  });

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping market automation service...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Stopping market automation service...');
  process.exit(0);
});
