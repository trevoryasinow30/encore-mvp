import { pool } from '@/lib/db';

export async function ensureLastfmSchema() {
  const client = await pool.connect();

  try {
    const songTableResult = await client.query<{ exists: boolean }>(`
      SELECT to_regclass('public."Song"') IS NOT NULL AS exists
    `);

    if (!songTableResult.rows[0]?.exists) {
      return false;
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS "LastfmMetric" (
        "songId" TEXT PRIMARY KEY,
        "playcount" DECIMAL(20, 0) NOT NULL DEFAULT 0,
        "listeners" DECIMAL(20, 0) NOT NULL DEFAULT 0,
        "playcountDelta" DECIMAL(20, 0) NOT NULL DEFAULT 0,
        "syncedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LastfmMetric_songId_fkey"
          FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "LastfmMetric_syncedAt_idx"
      ON "LastfmMetric"("syncedAt")
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "LastfmMetric_playcount_idx"
      ON "LastfmMetric"("playcount")
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "LastfmMetric_playcountDelta_idx"
      ON "LastfmMetric"("playcountDelta")
    `);

    return true;
  } finally {
    client.release();
  }
}
