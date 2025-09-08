import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_KEY

if (!url || !key) {
  console.error('VITE_SUPABASE_URL or VITE_SUPABASE_KEY not set')
  process.exit(1)
}

const supabase = createClient(url, key)

async function main() {
  const { data, error } = await supabase.from('users').select('*').limit(1)
  if (error) {
    console.error('query error', error)
    process.exit(1)
  }
  console.log('sample user', data)
}

main()
