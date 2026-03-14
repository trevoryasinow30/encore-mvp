import 'dotenv/config';
import fs from 'fs';
import csv from 'csv-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SongRow {
  title: string;
  artistName: string;
  releaseYear?: string;
  spotifyTrackId?: string;
  isCover?: string;
}

interface ImportStats {
  total: number;
  added: number;
  skipped: number;
  errors: number;
}

async function importSongFromRow(row: SongRow, stats: ImportStats) {
  const title = row.title?.trim();
  const artistName = row.artistName?.trim();

  if (!title || !artistName) {
    console.log(`  ⚠️  Skipping row: missing title or artist`);
    stats.errors++;
    return;
  }

  const releaseYear = row.releaseYear ? parseInt(row.releaseYear) : null;
  const spotifyTrackId = row.spotifyTrackId?.trim() || null;
  const isCover = row.isCover?.toLowerCase() === 'true' || row.isCover === '1';

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
          data: { spotifyTrackId },
        });
        console.log(`  ↻ Updated: ${title} - ${artistName}`);
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
        isCover,
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
  const args = process.argv.slice(2);
  const csvFile = args[0] || 'songs.csv';

  console.log('📥 CSV Song Importer\n');
  console.log(`📂 Reading from: ${csvFile}\n`);

  if (!fs.existsSync(csvFile)) {
    console.error(`❌ File not found: ${csvFile}`);
    console.error('\nUsage: npx tsx csv-importer.ts [filename.csv]');
    console.error('Example: npx tsx csv-importer.ts songs.csv');
    process.exit(1);
  }

  const stats: ImportStats = {
    total: 0,
    added: 0,
    skipped: 0,
    errors: 0,
  };

  const rows: SongRow[] = [];

  // Read CSV file
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFile)
      .pipe(csv())
      .on('data', (row: SongRow) => {
        rows.push(row);
      })
      .on('end', () => {
        resolve();
      })
      .on('error', (error) => {
        reject(error);
      });
  });

  console.log(`📊 Found ${rows.length} songs in CSV\n`);
  console.log('🔄 Starting import...\n');

  for (const row of rows) {
    stats.total++;
    await importSongFromRow(row, stats);

    // Progress indicator every 50 songs
    if (stats.total % 50 === 0) {
      console.log(`\n   Progress: ${stats.total}/${rows.length} processed...\n`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Import Complete!');
  console.log('='.repeat(60));
  console.log(`   Total rows processed: ${stats.total}`);
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
