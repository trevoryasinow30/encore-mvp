import 'dotenv/config';
import { pool } from '../lib/db';
import { ensureLastfmSchema } from '../lib/lastfm-schema';
import { hasLastfmApiKey, LASTFM_API_KEY_ERROR, syncLastfmMarketData } from '../lib/lastfm-market';

async function main() {
  console.log('📻 Syncing Last.fm listening data...\n');

  if (!hasLastfmApiKey()) {
    console.error(`❌ ${LASTFM_API_KEY_ERROR}`);
    process.exit(1);
  }

  await ensureLastfmSchema();
  const result = await syncLastfmMarketData();

  console.log('✅ Last.fm sync complete');
  console.log(`   Songs synced: ${result.syncedSongs}`);
  console.log(`   Missing Last.fm matches: ${result.missingSongs}`);
  console.log(`   Prices initialized from Last.fm: ${result.initializedPrices}`);
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Last.fm sync failed: ${message}`);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
