import 'dotenv/config';
import {
  hasSpotifyCredentials,
  SPOTIFY_CREDENTIALS_ERROR,
  syncSpotifyMarketData,
} from '../lib/spotify-market';

async function main() {
  console.log('🎧 Syncing Spotify track metadata...\n');

  if (!hasSpotifyCredentials()) {
    console.error(`❌ ${SPOTIFY_CREDENTIALS_ERROR}`);
    process.exit(1);
  }

  const result = await syncSpotifyMarketData();

  console.log('✅ Spotify metadata sync complete');
  console.log(`   Songs updated: ${result.syncedSongs}`);
  console.log(`   Spotify matches fetched: ${result.syncedSnapshots}`);
  console.log(`   Missing track IDs resolved: ${result.resolvedTrackIds}`);
  console.log(`   Songs still missing Spotify matches: ${result.unresolvedTrackIds}`);
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Spotify metadata sync failed: ${message}`);
    process.exit(1);
  });
