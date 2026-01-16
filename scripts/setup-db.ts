import { pool } from '../lib/db';
import { readFileSync } from 'fs';
import { join } from 'path';

async function setupDatabase() {
  const client = await pool.connect();

  try {
    console.log('🔧 Setting up database schema...');

    const schemaSQL = readFileSync(join(__dirname, '..', 'db', 'schema.sql'), 'utf-8');

    await client.query(schemaSQL);

    console.log('✅ Database schema created successfully!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase()
  .then(() => {
    console.log('✅ Setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
