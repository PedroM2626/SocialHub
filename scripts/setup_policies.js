import { Client } from 'pg'

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

  const tables = ['users', 'posts', 'communities', 'tags', 'tasks']

  try {
    for (const t of tables) {
      console.log('Configuring RLS and policies for', t)
      await client.query(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`)
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = '${t}_allow_select_all') THEN
            CREATE POLICY ${t}_allow_select_all ON ${t} FOR SELECT USING (true);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = '${t}_allow_insert_all') THEN
            CREATE POLICY ${t}_allow_insert_all ON ${t} FOR INSERT WITH CHECK (true);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = '${t}_allow_update_all') THEN
            CREATE POLICY ${t}_allow_update_all ON ${t} FOR UPDATE USING (true) WITH CHECK (true);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = '${t}_allow_delete_all') THEN
            CREATE POLICY ${t}_allow_delete_all ON ${t} FOR DELETE USING (true);
          END IF;
        END$$;
      `)
    }

    console.log('Policies created/enabled successfully')
  } catch (err) {
    console.error('Error creating policies:', err)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main()
