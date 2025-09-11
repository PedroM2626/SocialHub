const { Client } = require('pg')

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL not set')
    process.exit(1)
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT,
        date TIMESTAMPTZ,
        color TEXT,
        start_time TEXT,
        end_time TEXT,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL
      );
    `)
    console.log('events table created or already exists')
  } catch (err) {
    console.error('Failed to create events table:', err)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main()
