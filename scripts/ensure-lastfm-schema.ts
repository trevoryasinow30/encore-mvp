import 'dotenv/config';
import { pool } from '../lib/db';
import { ensureLastfmSchema } from '../lib/lastfm-schema';

async function main() {
  const createdOrVerified = await ensureLastfmSchema();

  if (createdOrVerified) {
    console.log('✅ Last.fm schema is ready');
  } else {
    console.log('ℹ️  Skipped Last.fm schema setup because the Song table does not exist yet');
  }
}

main()
  .catch((error) => {
    console.error('❌ Failed to ensure Last.fm schema:', error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
