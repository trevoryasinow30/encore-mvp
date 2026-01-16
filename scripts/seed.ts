import { pool, generateId } from '../lib/db';
import { hash } from 'bcryptjs';

async function main() {
  const client = await pool.connect();

  try {
    console.log('🌱 Starting database seed...');

    // Create demo user
    const userId = generateId();
    const hashedPassword = await hash('demo123', 10);

    await client.query(`
      INSERT INTO "User" (id, username, password, email, "createdAt")
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (username) DO NOTHING
    `, [userId, 'demo', hashedPassword, 'demo@example.com']);

    console.log('✓ Created demo user (username: demo, password: demo123)');

    // Create sample songs
    const songs = [
      { title: 'Bohemian Rhapsody', artist: 'Queen', year: 1975, price: 45.50, change: 12.5 },
      { title: 'Billie Jean', artist: 'Michael Jackson', year: 1983, price: 52.30, change: 8.2 },
      { title: 'Smells Like Teen Spirit', artist: 'Nirvana', year: 1991, price: 38.75, change: -3.1 },
      { title: 'Hotel California', artist: 'Eagles', year: 1976, price: 41.20, change: 5.6 },
      { title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', year: 1987, price: 44.90, change: 15.3 },
      { title: 'Stairway to Heaven', artist: 'Led Zeppelin', year: 1971, price: 48.60, change: 7.8 },
      { title: 'Imagine', artist: 'John Lennon', year: 1971, price: 39.40, change: -1.5 },
      { title: 'Hey Jude', artist: 'The Beatles', year: 1968, price: 56.20, change: 18.9 },
      { title: 'Purple Rain', artist: 'Prince', year: 1984, price: 43.80, change: 6.4 },
      { title: 'Wonderwall', artist: 'Oasis', year: 1995, price: 35.50, change: 22.7 },
    ];

    for (const song of songs) {
      const songId = generateId();
      const marketId = generateId();

      await client.query(`
        INSERT INTO "Song" (id, title, "artistName", "releaseYear", "createdAt")
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT DO NOTHING
      `, [songId, song.title, song.artist, song.year]);

      await client.query(`
        INSERT INTO "MarketState" (id, "songId", price, "change24hPct", "volume24h", "traders24h", tags, "lastUpdatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT ("songId") DO NOTHING
      `, [
        marketId,
        songId,
        song.price,
        song.change,
        Math.floor(Math.random() * 100000),
        Math.floor(Math.random() * 500),
        song.change > 15 ? ['TRENDING', 'HOT'] : song.change < 0 ? ['FALLING'] : []
      ]);
    }

    console.log(`✓ Created ${songs.length} sample songs with market data`);

    // Create some sample price history
    console.log('✓ Database seeded successfully!');

  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main()
  .then(() => {
    console.log('✅ Seed completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
