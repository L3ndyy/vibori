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
console.log('Using DB URL:', dbUrl.slice(0, 30) + '...');
const { neon } = require('@neondatabase/serverless');
const sql = neon(dbUrl);

async function main() {
  try {
    const res = await sql`SELECT * FROM votes_voters`;
    console.log('SUCCESS! Rows count:', res.length);
    console.log('Rows:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('SQL query error:', err);
  }
}

main();
