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

async function fetchAlbumArtFromiTunes(
  songTitle: string,
  artistName: string
): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${songTitle} ${artistName}`);
    const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`;

    const response = await fetch(url);
    const data: iTunesSearchResult = await response.json();

    if (data.results && data.results.length > 0) {
      // Get the artwork URL and upgrade to higher resolution (600x600)
      const artworkUrl = data.results[0].artworkUrl100;
      const highResUrl = artworkUrl.replace('100x100bb', '600x600bb');
      return highResUrl;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching artwork for ${songTitle}:`, error);
    return null;
  }
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

    // Rate limiting: wait 200ms between requests to be nice to iTunes API
    await new Promise((resolve) => setTimeout(resolve, 200));
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
