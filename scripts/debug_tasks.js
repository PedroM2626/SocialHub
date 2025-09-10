import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_KEY

if (!url || !key) {
  console.error('VITE_SUPABASE_URL or VITE_SUPABASE_KEY not set')
  process.exit(1)
}

const supabase = createClient(url, key)

async function main() {
  const email = process.argv[2]
  console.log('Checking tasks for email:', email)

  // find user
  const { data: users, error: uErr } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .limit(1)

  if (uErr) {
    console.error('Error fetching user:', uErr)
    process.exit(1)
  }

  if (!users || users.length === 0) {
    console.log('No user found with that email. Will list total tasks in DB.')
  }

  // list tasks count
  const { data: allTasks, error: tErr } = await supabase
    .from('tasks')
    .select('*')
  if (tErr) {
    console.error('Error fetching tasks:', tErr)
    process.exit(1)
  }
  console.log('Total tasks in DB:', (allTasks || []).length)

  if (users && users.length > 0) {
    const user = users[0]
    console.log('Found user id:', user.id)
    const { data: userTasks, error: utErr } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
    if (utErr) {
      console.error('Error fetching user tasks:', utErr)
      process.exit(1)
    }
    console.log(`Tasks for user ${email}:`, (userTasks || []).length)
    console.dir((userTasks || []).slice(0, 10), { depth: null })
  } else {
    console.log('No user-specific tasks displayed because user not found.')
    console.log('Showing up to 10 tasks from DB:')
    console.dir((allTasks || []).slice(0, 10), { depth: null })
  }
}

main().catch((e) => {
  console.error('Unexpected error', e)
  process.exit(1)
})
