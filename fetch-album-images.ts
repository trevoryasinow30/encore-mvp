import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface iTunesSearchResult {
  results: Array<{
    trackName: string;
    artistName: string;
    artworkUrl100: string;
    artworkUrl60: string;
  }>;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAlbumArtFromiTunes(
  songTitle: string,
  artistName: string
): Promise<string | null> {
  const query = encodeURIComponent(`${songTitle} ${artistName}`);
  const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`;

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'encore-mvp-artwork-fetcher',
        },
      });
      const body = await response.text();

      if (!response.ok) {
        if (attempt < 4) {
          await sleep(1500 * attempt);
          continue;
        }
        return null;
      }

      const data = JSON.parse(body) as iTunesSearchResult;

      if (data.results && data.results.length > 0) {
        const artworkUrl = data.results[0].artworkUrl100;
        return artworkUrl.replace('100x100bb', '600x600bb');
      }

      return null;
    } catch (error) {
      if (attempt < 4) {
        await sleep(1500 * attempt);
        continue;
      }

      console.error(`Error fetching artwork for ${songTitle}:`, error);
      return null;
    }
  }

  return null;
}

async function updateAllSongImages() {
  console.log('🎵 Fetching album images from iTunes API...\n');

  // Get all songs that don't have images yet
  const songs = await prisma.song.findMany({
    where: {
      OR: [
        { albumImageUrl: null },
        { albumImageUrl: '' },
      ],
    },
    select: {
      id: true,
      title: true,
      artistName: true,
    },
  });

  console.log(`Found ${songs.length} songs without images.\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    console.log(
      `[${i + 1}/${songs.length}] Fetching: "${song.title}" by ${song.artistName}`
    );

    const imageUrl = await fetchAlbumArtFromiTunes(song.title, song.artistName);

    if (imageUrl) {
      await prisma.song.update({
        where: { id: song.id },
        data: { albumImageUrl: imageUrl },
      });
      console.log(`   ✅ Success: ${imageUrl}\n`);
      successCount++;
    } else {
      console.log(`   ❌ No artwork found\n`);
      failCount++;
    }

    // Keep the request pace conservative to avoid iTunes rate limiting.
    await sleep(450);
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Successfully fetched: ${successCount} images`);
  console.log(`   ❌ Not found: ${failCount} songs`);
  console.log('\n✨ Done!');

  await prisma.$disconnect();
}

// Run the script
updateAllSongImages().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
