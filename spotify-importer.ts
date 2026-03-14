import 'dotenv/config';
import SpotifyWebApi from 'spotify-web-api-node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// Popular Spotify playlists to import from
const PLAYLISTS = [
  '37i9dQZF1DXcBWIGoYBM5M', // Today's Top Hits
  '37i9dQZF1DX0XUsuxWHRQd', // RapCaviar
  '37i9dQZF1DX4dyzvuaRJ0n', // mint (new music)
  '37i9dQZF1DX4JAvHpjipBk', // New Music Friday
  '37i9dQZF1DX1lVhptIYRda', // Hot Country
  '37i9dQZF1DX0BcQWzuB7ZO', // Dance Hits
  '37i9dQZF1DWXRqgorJj26U', // Rock Classics
  '37i9dQZF1DX4o1oenSJRJd', // All Out 2010s
  '37i9dQZF1DX4UtSsGT1Sbe', // All Out 2000s
  '37i9dQZF1DXbTxeAdrVG2l', // All Out 90s
  '37i9dQZF1DX4UtSsGT1Sbe', // All Out 80s
  '37i9dQZF1DX6ALfRKlHn1t', // Chill Hits
  '37i9dQZF1DWTwnEm1IYyoj', // Mega Hit Mix
  '37i9dQZF1DXcF6B6QPhFDv', // R&B classics
  '37i9dQZF1DX0SM0LYsmbMT', // Latin Hits
];

interface ImportStats {
  total: number;
  added: number;
  skipped: number;
  errors: number;
}

async function authenticateSpotify() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body.access_token);
    console.log('✓ Spotify API authenticated');
    return true;
  } catch (error) {
    console.error('❌ Failed to authenticate with Spotify:', error);
    return false;
  }
}

async function getPlaylistTracks(playlistId: string) {
  try {
    const data = await spotifyApi.getPlaylist(playlistId);
    return data.body.tracks.items;
  } catch (error) {
    console.error(`❌ Failed to fetch playlist ${playlistId}:`, error);
    return [];
  }
}

async function importSong(track: any, stats: ImportStats) {
  if (!track.track) {
    return;
  }

  const spotifyTrack = track.track;
  const title = spotifyTrack.name;
  const artistName = spotifyTrack.artists[0]?.name || 'Unknown Artist';
  const spotifyTrackId = spotifyTrack.id;
  const albumImageUrl = spotifyTrack.album?.images?.[0]?.url || null;

  // Extract release year from album
  const releaseDate = spotifyTrack.album?.release_date;
  const releaseYear = releaseDate ? parseInt(releaseDate.split('-')[0]) : null;

  try {
    // Check if song already exists
    const existing = await prisma.song.findFirst({
      where: {
        AND: [
          { title: { equals: title, mode: 'insensitive' } },
          { artistName: { equals: artistName, mode: 'insensitive' } },
        ],
      },
    });

    if (existing) {
      // Update Spotify ID if missing
      if (!existing.spotifyTrackId && spotifyTrackId) {
        await prisma.song.update({
          where: { id: existing.id },
          data: {
            spotifyTrackId,
            albumImageUrl: existing.albumImageUrl || albumImageUrl,
          },
        });
        console.log(`  ↻ Updated Spotify ID: ${title} - ${artistName}`);
      }
      stats.skipped++;
      return;
    }

    // Create new song
    const song = await prisma.song.create({
      data: {
        title,
        artistName,
        releaseYear,
        spotifyTrackId,
        albumImageUrl,
        isCover: false,
      },
    });

    // Create market state
    await prisma.marketState.create({
      data: {
        songId: song.id,
        price: 1.00,
        change24hPct: 0,
        volume24h: 0,
        traders24h: 0,
        tags: [],
      },
    });

    console.log(`  ✓ Added: ${title} - ${artistName} (${releaseYear || 'N/A'})`);
    stats.added++;
  } catch (error) {
    console.error(`  ❌ Error importing ${title}:`, error);
    stats.errors++;
  }
}

async function main() {
  console.log('🎵 Spotify Song Importer\n');

  // Check for credentials
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    console.error('❌ Missing Spotify credentials!');
    console.error('   Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env');
    console.error('\n📖 See SPOTIFY_SETUP.md for instructions');
    process.exit(1);
  }

  // Authenticate
  const authenticated = await authenticateSpotify();
  if (!authenticated) {
    process.exit(1);
  }

  const stats: ImportStats = {
    total: 0,
    added: 0,
    skipped: 0,
    errors: 0,
  };

  console.log(`\n📥 Importing songs from ${PLAYLISTS.length} playlists...\n`);

  for (const playlistId of PLAYLISTS) {
    console.log(`\n📂 Fetching playlist: ${playlistId}`);
    const tracks = await getPlaylistTracks(playlistId);

    console.log(`   Found ${tracks.length} tracks`);
    stats.total += tracks.length;

    for (const track of tracks) {
      await importSong(track, stats);

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Import Complete!');
  console.log('='.repeat(60));
  console.log(`   Total tracks processed: ${stats.total}`);
  console.log(`   ✓ Added: ${stats.added} songs`);
  console.log(`   ↻ Skipped: ${stats.skipped} songs (already exist)`);
  console.log(`   ❌ Errors: ${stats.errors}`);
  console.log('='.repeat(60));

  const totalSongs = await prisma.song.count();
  console.log(`\n📊 Total songs in database: ${totalSongs}`);
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
