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
    const res = await client.query('SELECT id, date FROM events')
    console.log(`Found ${res.rows.length} events in DB`)
    for (const row of res.rows) {
      try {
        const d = row.date ? new Date(row.date) : null
        if (!d) continue
        // normalize to UTC midnight of the same date
        const norm = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0))
        await client.query('UPDATE events SET date = $1 WHERE id = $2', [norm.toISOString(), row.id])
        console.log('Normalized event', row.id, norm.toISOString())
      } catch (err) {
        console.error('Failed to normalize', row.id, err)
      }
    }
  } catch (err) {
    console.error('Failed to read events table or table missing:', err)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main()
