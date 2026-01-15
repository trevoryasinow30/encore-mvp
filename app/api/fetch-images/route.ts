import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function fetchAlbumArtFromiTunes(
  songTitle: string,
  artistName: string
): Promise<{ albumImageUrl: string | null; artistImageUrl: string | null }> {
  try {
    const query = encodeURIComponent(`${songTitle} ${artistName}`);
    const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      // Get high-res artwork (600x600 instead of 100x100)
      const albumImageUrl = result.artworkUrl100
        ? result.artworkUrl100.replace('100x100bb', '600x600bb')
        : null;

      return {
        albumImageUrl,
        artistImageUrl: null, // iTunes doesn't provide separate artist images
      };
    }

    return { albumImageUrl: null, artistImageUrl: null };
  } catch (error) {
    console.error(`Error fetching artwork for ${songTitle}:`, error);
    return { albumImageUrl: null, artistImageUrl: null };
  }
}

export async function GET() {
  try {
    console.log('Starting image fetch process...');

    // Get all songs without images
    const songs = await prisma.song.findMany({
      where: {
        OR: [
          { albumImageUrl: null },
          { artistImageUrl: null },
        ],
      },
      select: {
        id: true,
        title: true,
        artistName: true,
      },
      take: 50, // Process in batches of 50
    });

    console.log(`Found ${songs.length} songs without images`);

    let updated = 0;
    let failed = 0;

    for (const song of songs) {
      console.log(`Fetching images for: ${song.title} by ${song.artistName}`);

      const { albumImageUrl, artistImageUrl } = await fetchAlbumArtFromiTunes(
        song.title,
        song.artistName
      );

      if (albumImageUrl || artistImageUrl) {
        await prisma.song.update({
          where: { id: song.id },
          data: {
            albumImageUrl: albumImageUrl || undefined,
            artistImageUrl: artistImageUrl || undefined,
          },
        });
        console.log(`✓ Updated ${song.title}`);
        updated++;
      } else {
        console.log(`✗ No images found for ${song.title}`);
        failed++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${songs.length} songs`,
      updated,
      failed,
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
