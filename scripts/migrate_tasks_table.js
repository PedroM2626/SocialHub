import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_KEY

if (!url || !key) {
  console.error('VITE_SUPABASE_URL or VITE_SUPABASE_KEY not set')
  process.exit(1)
}

const supabase = createClient(url, key)

async function main() {
  console.log('Running tasks table migration...')
  // Add columns if not exist
  const queries = [
    `ALTER TABLE IF EXISTS tasks ADD COLUMN IF NOT EXISTS user_id text;`,
    `ALTER TABLE IF EXISTS tasks ADD COLUMN IF NOT EXISTS start_time text;`,
    `ALTER TABLE IF EXISTS tasks ADD COLUMN IF NOT EXISTS end_time text;`,
  ]

  for (const q of queries) {
    const { error } = await supabase.rpc('sql', { q }).catch(() => ({ error: { message: 'rpc sql not available' } }))
    if (error) {
      // Fallback: try using query via postgrest
      try {
        await supabase.from('tasks').select('*').limit(1)
        // If select worked but rpc not available, attempt using direct SQL via the query endpoint is not available in supabase-js
        console.warn('Could not run direct SQL via RPC. Please run the following SQL manually in your Supabase SQL editor:')
        console.warn(queries.join('\n'))
        process.exit(1)
      } catch (e) {
        console.error('Error checking tasks table', e)
        console.warn('Please run the following SQL manually in your Supabase SQL editor:')
        console.warn(queries.join('\n'))
        process.exit(1)
      }
    } else {
      console.log('Executed:', q)
    }
  }

  console.log('Migration finished.')
}

main().catch((e) => {
  console.error('Migration failed', e)
  process.exit(1)
})
