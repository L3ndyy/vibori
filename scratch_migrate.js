const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
let dbUrl = '';
for (const line of lines) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.substring('DATABASE_URL='.length).trim().replace(/^"/, '').replace(/"$/, '');
    break;
  }
}
console.log('Connecting to Neon DB...');
const { neon } = require('@neondatabase/serverless');
const sql = neon(dbUrl);

async function main() {
  try {
    console.log('Creating votes_voters table...');
    await sql`
      CREATE TABLE IF NOT EXISTS votes_voters (
        voter_id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        student_name VARCHAR(255),
        device_id VARCHAR(255),
        candidate_id VARCHAR(255) NOT NULL,
        voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('Creating votes_settings table...');
    await sql`
      CREATE TABLE IF NOT EXISTS votes_settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT NOT NULL
      );
    `;
    console.log('Tables created successfully!');
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;
    console.log('Public tables in DB:', tables);
  } catch (err) {
    console.error('Migration error:', err);
  }
}

main();
