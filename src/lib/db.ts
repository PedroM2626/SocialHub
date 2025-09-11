import { supabase } from './supabase'
import { Post, User, Community, Tag, Task } from './types'

// Helper to avoid hanging requests: race the supabase promise with a timeout
async function withTimeout<T>(p: Promise<T>, ms = 10000): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase request timed out')), ms),
    ),
  ])
}

// Runtime feature detection: check if tasks.user_id, backgroundColor and borderStyle columns exist
let TASKS_HAS_USER_ID: boolean | null = null
let TASKS_HAS_BACKGROUND_COLOR: boolean | null = null
let TASKS_HAS_BORDER_STYLE: boolean | null = null
;(async () => {
  try {
    // Try lightweight selects; if column missing, Postgres will error
    const checks = await Promise.allSettled([
      withTimeout(supabase.from('tasks').select('user_id').limit(1)),
      withTimeout(supabase.from('tasks').select('backgroundColor').limit(1)),
      withTimeout(supabase.from('tasks').select('borderStyle').limit(1)),
    ])

    TASKS_HAS_USER_ID =
      checks[0].status === 'fulfilled' && !(checks[0] as any).value?.error
    TASKS_HAS_BACKGROUND_COLOR =
      checks[1].status === 'fulfilled' && !(checks[1] as any).value?.error
    TASKS_HAS_BORDER_STYLE =
      checks[2].status === 'fulfilled' && !(checks[2] as any).value?.error
  } catch (_e) {
    // assume missing column or network issue
    TASKS_HAS_USER_ID = TASKS_HAS_USER_ID ?? false
    TASKS_HAS_BACKGROUND_COLOR = TASKS_HAS_BACKGROUND_COLOR ?? false
    TASKS_HAS_BORDER_STYLE = TASKS_HAS_BORDER_STYLE ?? false
  }
})()

export async function getUsers(): Promise<User[]> {
  try {
    const { data, error } = await withTimeout(
      supabase.from('users').select('*'),
    )
    if (error) throw error
    return (data || []) as User[]
  } catch (err) {
    console.warn('getUsers fallback to empty array', err)
    return []
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const { data, error } = await withTimeout(
      supabase.from('users').select('*').eq('id', id).limit(1).single(),
    )
    if (error) throw error
    return data as User
  } catch (err) {
    console.warn('getUserById failed', err)
    return null
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await withTimeout(
      supabase.from('users').select('*').eq('email', email).limit(1).single(),
    )
    if (error) throw error
    return data as User
  } catch (err) {
    console.warn('getUserByEmail failed', err)
    return null
  }
}

export async function createUser(payload: Partial<User>): Promise<User | null> {
  try {
    const { data, error } = await withTimeout(
      supabase.from('users').insert(payload).select().single(),
    )
    if (error) throw error
    return data as User
  } catch (err) {
    console.warn('createUser failed', err)
    return null
  }
}

export async function getPosts(): Promise<Post[]> {
  try {
    const { data: posts, error } = await withTimeout(
      supabase
        .from('posts')
        .select('*')
        .order('created_date', { ascending: false }),
    )
    if (error) throw error
    const postsArr = (posts || []) as any[]

    // fetch authors
    const userIds = Array.from(
      new Set(postsArr.map((p) => p.author_id).filter(Boolean)),
    )
    let usersMap: Record<string, User> = {}
    if (userIds.length > 0) {
      const { data: users } = await withTimeout(
        supabase.from('users').select('*').in('id', userIds),
      )
      usersMap = (users || []).reduce((acc: any, u: any) => {
        acc[u.id] = u
        return acc
      }, {})
    }

    return postsArr.map((p) => ({
      id: p.id,
      author: usersMap[p.author_id] || (p.author as unknown as User) || null,
      created_date: p.created_date,
      content: p.content,
      image_url: p.image_url,
      hashtags: p.hashtags || [],
      likes_count: p.likes_count || 0,
      comments_count: p.comments_count || 0,
      comments: p.comments || [],
      reactions: p.reactions || {},
    })) as Post[]
  } catch (err) {
    console.warn('getPosts failed', err)
    return []
  }
}

export async function createPost(payload: Partial<Post>): Promise<Post | null> {
  try {
    const record = {
      id: payload.id,
      author_id: (payload.author as any)?.id || null,
      created_date: payload.created_date || new Date().toISOString(),
      content: payload.content,
      image_url: payload.image_url,
      hashtags: payload.hashtags || [],
      likes_count: payload.likes_count || 0,
      comments_count: payload.comments_count || 0,
      reactions: payload.reactions || {},
      comments: payload.comments || [],
    }
    const { data, error } = await withTimeout(
      supabase.from('posts').insert(record).select().single(),
    )
    if (error) throw error
    // attach author
    const author = await getUserById(record.author_id)
    return {
      id: data.id,
      author: author || (payload.author as User),
      created_date: data.created_date,
      content: data.content,
      image_url: data.image_url,
      hashtags: data.hashtags || [],
      likes_count: data.likes_count || 0,
      comments_count: data.comments_count || 0,
      comments: data.comments || [],
      reactions: data.reactions || {},
    } as Post
  } catch (err) {
    console.warn('createPost failed', err)
    return null
  }
}

export async function updateUser(
  id: string,
  payload: Partial<User>,
): Promise<User | null> {
  try {
    const { data, error } = await withTimeout(
      supabase.from('users').update(payload).eq('id', id).select().single(),
    )
    if (error) throw error
    return data as User
  } catch (err) {
    console.warn('updateUser failed', err)
    return null
  }
}

export async function addCommentToPost(
  postId: string,
  comment: any,
): Promise<boolean> {
  try {
    // Fetch existing comments
    const { data: post, error: fetchErr } = await withTimeout(
      supabase.from('posts').select('comments').eq('id', postId).single(),
    )
    if (fetchErr) throw fetchErr
    const existingComments = post?.comments || []
    const newComments = [...existingComments, comment]
    const { error } = await withTimeout(
      supabase
        .from('posts')
        .update({ comments: newComments, comments_count: newComments.length })
        .eq('id', postId),
    )
    if (error) throw error
    return true
  } catch (err) {
    console.warn('addCommentToPost failed', err)
    return false
  }
}

export async function updatePostReactions(
  postId: string,
  reactions: Record<string, number>,
): Promise<boolean> {
  try {
    const { error } = await withTimeout(
      supabase.from('posts').update({ reactions }).eq('id', postId),
    )
    if (error) throw error
    return true
  } catch (err) {
    console.warn('updatePostReactions failed', err)
    return false
  }
}

export async function updatePostLikes(
  postId: string,
  likes_count: number,
): Promise<boolean> {
  try {
    const { error } = await withTimeout(
      supabase.from('posts').update({ likes_count }).eq('id', postId),
    )
    if (error) throw error
    return true
  } catch (err) {
    console.warn('updatePostLikes failed', err)
    return false
  }
}

// Desabafos (anonymous vent) persistence
// Local fallback storage helpers (browser localStorage)
function readLocalDesabafos(): any[] {
  try {
    const raw = localStorage.getItem('local:desabafos')
    if (!raw) return []
    return JSON.parse(raw)
  } catch (err) {
    console.warn('readLocalDesabafos failed', err)
    return []
  }
}

function writeLocalDesabafos(items: any[]) {
  try {
    localStorage.setItem('local:desabafos', JSON.stringify(items))
  } catch (err) {
    console.warn('writeLocalDesabafos failed', err)
  }
}

export async function getDesabafos(): Promise<any[]> {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('desabafos')
        .select('*')
        .order('created_at', { ascending: false }),
    )
    if (error) throw error
    const remote = data || []
    // include local fallback items as well
    const local = readLocalDesabafos()
    return [...local, ...remote]
  } catch (err) {
    console.warn('getDesabafos failed, returning local fallback', err)
    return readLocalDesabafos()
  }
}

export async function createDesabafo(payload: {
  id?: string
  content: string
  image_url?: string | null
  hashtags?: string[] | null
  user_id?: string | null
}) {
  const record = {
    id: payload.id || `desabafo-${Date.now()}`,
    content: payload.content,
    image_url: payload.image_url || null,
    hashtags: payload.hashtags || [],
    user_id: payload.user_id || null,
    created_at: new Date().toISOString(),
  }

  try {
    const { data, error } = await withTimeout(
      supabase.from('desabafos').insert(record).select().single(),
    )
    if (error) throw error
    return data
  } catch (err) {
    console.warn('createDesabafo failed, saving locally as fallback', err)
    // persist to localStorage as fallback
    try {
      const current = readLocalDesabafos()
      const next = [record, ...current]
      writeLocalDesabafos(next)
      return record
    } catch (e) {
      console.error('Failed to save desabafo locally', e)
      return null
    }
  }
}

export async function updateDesabafo(
  id: string,
  payload: {
    content?: string
    hashtags?: string[] | null
    image_url?: string | null
  },
) {
  try {
    const { error } = await withTimeout(
      supabase.from('desabafos').update(payload).eq('id', id),
    )
    if (error) throw error
    return true
  } catch (err) {
    console.warn('updateDesabafo failed, applying local fallback', err)
    try {
      const current = readLocalDesabafos()
      const next = current.map((d) => (d.id === id ? { ...d, ...payload } : d))
      writeLocalDesabafos(next)
      return true
    } catch (e) {
      console.error('local updateDesabafo failed', e)
      return false
    }
  }
}

export async function deleteDesabafo(id: string) {
  try {
    const { error } = await withTimeout(
      supabase.from('desabafos').delete().eq('id', id),
    )
    if (error) throw error
    return true
  } catch (err) {
    console.warn('deleteDesabafo failed, applying local fallback', err)
    try {
      const current = readLocalDesabafos()
      const next = current.filter((d) => d.id !== id)
      writeLocalDesabafos(next)
      return true
    } catch (e) {
      console.error('local deleteDesabafo failed', e)
      return false
    }
  }
}

export async function updateDesabafoReactions(
  id: string,
  reactions: Record<string, number>,
): Promise<boolean> {
  try {
    const { error } = await withTimeout(
      supabase.from('desabafos').update({ reactions }).eq('id', id),
    )
    if (error) throw error
    return true
  } catch (err) {
    console.warn('updateDesabafoReactions failed, applying local fallback', err)
    try {
      const current = readLocalDesabafos()
      const next = current.map((d) => (d.id === id ? { ...d, reactions } : d))
      writeLocalDesabafos(next)
      return true
    } catch (e) {
      console.error('local updateDesabafoReactions failed', e)
      return false
    }
  }
}

export async function addCommentToDesabafo(
  desabafoId: string,
  comment: any,
): Promise<boolean> {
  try {
    const { data: row, error: fetchErr } = await withTimeout(
      supabase
        .from('desabafos')
        .select('comments')
        .eq('id', desabafoId)
        .single(),
    )
    if (fetchErr) throw fetchErr
    const existing = row?.comments || []
    const newComments = [...existing, comment]
    const { error } = await withTimeout(
      supabase
        .from('desabafos')
        .update({ comments: newComments })
        .eq('id', desabafoId),
    )
    if (error) throw error
    return true
  } catch (err) {
    console.warn('addCommentToDesabafo failed, applying local fallback', err)
    try {
      const current = readLocalDesabafos()
      const next = current.map((d) =>
        d.id === desabafoId
          ? { ...d, comments: [...(d.comments || []), comment] }
          : d,
      )
      writeLocalDesabafos(next)
      return true
    } catch (e) {
      console.error('local addCommentToDesabafo failed', e)
      return false
    }
  }
}

// Local fallback for tasks
function readLocalTasks(): any[] {
  try {
    const raw = localStorage.getItem('local:tasks')
    if (!raw) return []
    return JSON.parse(raw)
  } catch (err) {
    console.warn('readLocalTasks failed', err)
    return []
  }
}

function writeLocalTasks(items: any[]) {
  try {
    localStorage.setItem('local:tasks', JSON.stringify(items))
  } catch (err) {
    console.warn('writeLocalTasks failed', err)
  }
}

// Tasks persistence
function errToString(err: any) {
  try {
    if (!err) return String(err)
    if (typeof err === 'string') return err
    if (err.message) return err.message
    return JSON.stringify(err)
  } catch (e) {
    return String(err)
  }
}

export async function getTasks(userId?: string): Promise<any[]> {
  try {
    let query = supabase
      .from('tasks')
      .select('*')
      .order('id', { ascending: false })
    // Only apply user filter if DB has user_id column
    if (userId && TASKS_HAS_USER_ID === true)
      query = query.eq('user_id', userId)
    const { data, error } = await withTimeout(query)
    if (error) throw error
    return data || []
  } catch (err) {
    const msg = errToString(err)
    console.error('getTasks failed', msg)
    // If failure due to missing user_id column, retry without user filter
    if (userId && /column\s+"?user_id"?\s+does not exist/i.test(msg)) {
      try {
        const { data, error } = await withTimeout(
          supabase.from('tasks').select('*').order('id', { ascending: false }),
        )
        if (error) throw error
        return data || []
      } catch (err2) {
        console.error('getTasks retry failed', errToString(err2))
        return []
      }
    }
    return []
  }
}

export async function createTask(payload: any) {
  const record: any = {
    id: payload.id || `task-${Date.now()}`,
    title: payload.title,
    description: payload.description || null,
    is_completed: payload.is_completed || false,
    priority: payload.priority || null,
    is_public: payload.is_public !== undefined ? payload.is_public : true,
    tags: payload.tags || [],
    due_date: payload.due_date || null,
    start_time: payload.start_time || null,
    end_time: payload.end_time || null,
    subtasks: payload.subtasks || [],
  }

  // Only include user_id if DB supports it
  if (payload.user_id && TASKS_HAS_USER_ID === true) record.user_id = payload.user_id

  // Only include backgroundColor and borderStyle if DB supports those columns
  if (TASKS_HAS_BACKGROUND_COLOR === true) record.backgroundColor = payload.backgroundColor || null
  if (TASKS_HAS_BORDER_STYLE === true) record.borderStyle = payload.borderStyle || null

  try {
    const { data, error } = await withTimeout(
      supabase.from('tasks').insert(record).select().single(),
    )
    if (error) throw error
    return data
  } catch (err) {
    const msg = errToString(err)
    console.error('createTask failed', msg)
    if (/column\s+"?user_id"?\s+does not exist/i.test(msg)) {
      throw new Error(
        'createTask failed: database missing user_id column. Run migration to add user_id column.',
      )
    }
    throw err
  }
}

export async function updateTask(id: string, payload: any, userId?: string) {
  try {
    // Sanitize payload for optional columns to avoid DB errors when columns are absent
    const sanitized: any = { ...payload }
    if (TASKS_HAS_BACKGROUND_COLOR !== true && 'backgroundColor' in sanitized)
      delete sanitized.backgroundColor
    if (TASKS_HAS_BORDER_STYLE !== true && 'borderStyle' in sanitized)
      delete sanitized.borderStyle

    let query = supabase.from('tasks').update(sanitized).eq('id', id)
    if (userId && TASKS_HAS_USER_ID === true) query = query.eq('user_id', userId)
    const { error } = await withTimeout(query)
    if (error) throw error
    return true
  } catch (err) {
    const msg = errToString(err)
    console.error('updateTask failed', msg)
    if (userId && /column\s+"?user_id"?\s+does not exist/i.test(msg)) {
      // retry without user filter
      try {
        const { error } = await withTimeout(
          supabase.from('tasks').update(payload).eq('id', id),
        )
        if (error) throw error
        return true
      } catch (err2) {
        console.error('updateTask retry failed', errToString(err2))
        throw err2
      }
    }
    throw err
  }
}

export async function deleteTask(id: string, userId?: string) {
  try {
    let query = supabase.from('tasks').delete().eq('id', id)
    if (userId && TASKS_HAS_USER_ID === true)
      query = query.eq('user_id', userId)
    const { error } = await withTimeout(query)
    if (error) throw error
    return true
  } catch (err) {
    const msg = errToString(err)
    console.error('deleteTask failed', msg)
    if (userId && /column\s+"?user_id"?\s+does not exist/i.test(msg)) {
      try {
        const { error } = await withTimeout(
          supabase.from('tasks').delete().eq('id', id),
        )
        if (error) throw error
        return true
      } catch (err2) {
        console.error('deleteTask retry failed', errToString(err2))
        throw err2
      }
    }
    throw err
  }
}

export async function deletePost(postId: string): Promise<boolean> {
  try {
    const { error } = await withTimeout(
      supabase.from('posts').delete().eq('id', postId),
    )
    if (error) throw error
    return true
  } catch (err) {
    console.warn('deletePost failed', err)
    return false
  }
}

export async function getConversationsForUser(userId: string) {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('conversations')
        .select('*')
        .or(`participant_id.eq.${userId}`),
    )
    if (error) throw error
    return data || []
  } catch (err) {
    console.warn('getConversationsForUser failed', err)
    return []
  }
}

export async function getMessagesForConversation(conversationId: string) {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_date', { ascending: true }),
    )
    if (error) throw error
    return data || []
  } catch (err) {
    console.warn('getMessagesForConversation failed', err)
    return []
  }
}

export async function createMessage(conversationId: string, message: any) {
  try {
    console.log('[DB] createMessage', { conversationId, message })
    const { data, error } = await withTimeout(
      supabase
        .from('messages')
        .insert({ ...message, conversation_id: conversationId })
        .select()
        .single(),
    )
    if (error) {
      console.warn('[DB] createMessage insert error', error)
      // if conversation missing (FK) try to create conversation and retry
      const errMsg = (error as any).message || ''
      if (
        errMsg.toLowerCase().includes('foreign key') ||
        errMsg.toLowerCase().includes('constrain') ||
        (error as any).code === '23503'
      ) {
        console.log(
          '[DB] createMessage: missing conversation, creating one and retrying',
        )
        try {
          await withTimeout(
            supabase
              .from('conversations')
              .insert({
                id: conversationId,
                participant_id: message.recipient_id,
                last_message_preview: message.content,
                last_message_date: message.created_date,
              })
              .select(),
          )
          const { data: data2, error: error2 } = await withTimeout(
            supabase
              .from('messages')
              .insert({ ...message, conversation_id: conversationId })
              .select()
              .single(),
          )
          if (error2) throw error2
          // update conversation preview
          await withTimeout(
            supabase
              .from('conversations')
              .update({
                last_message_preview: message.content,
                last_message_date: message.created_date,
              })
              .eq('id', conversationId),
          )
          return data2
        } catch (err2) {
          console.warn('[DB] createMessage retry failed', err2)
          throw err2
        }
      }
      throw error
    }
    // update conversation preview
    await withTimeout(
      supabase
        .from('conversations')
        .update({
          last_message_preview: message.content,
          last_message_date: message.created_date,
        })
        .eq('id', conversationId),
    )
    return data
  } catch (err) {
    console.warn('createMessage failed', err)
    return null
  }
}

export async function createConversation(conversation: any) {
  try {
    const { data, error } = await withTimeout(
      supabase.from('conversations').insert(conversation).select().single(),
    )
    if (error) throw error
    return data
  } catch (err) {
    console.warn('createConversation failed', err)
    return null
  }
}

// Expose a function to sync local fallback data (tasks/desabafos) to Supabase
export async function syncLocalToSupabase(userId?: string) {
  console.log('[DB] syncLocalToSupabase start', { userId })
  // Sync tasks
  try {
    const localTasks = readLocalTasks()
    if (Array.isArray(localTasks) && localTasks.length > 0) {
      console.log(`[DB] Found ${localTasks.length} local tasks to migrate`)
      let migrated = 0
      for (const t of localTasks) {
        try {
          const payload: any = { ...t }
          if (userId) payload.user_id = userId
          // Normalize dates
          if (payload.due_date && payload.due_date instanceof Date)
            payload.due_date = payload.due_date.toISOString()
          // Try to create; if already exists, skip
          try {
            const { data: existing } = await withTimeout(
              supabase.from('tasks').select('id').eq('id', payload.id).limit(1).single(),
            )
            if (existing && (existing as any).id) {
              console.log('[DB] task exists, skipping', (existing as any).id)
              continue
            }
          } catch (e) {
            // ignore check errors and attempt create
          }
          await createTask(payload)
          migrated++
        } catch (err) {
          console.warn('[DB] failed to migrate task', t.id, err)
        }
      }
      // remove local tasks only if we migrated at least one
      try {
        if (migrated > 0) localStorage.removeItem('local:tasks')
      } catch {}
    }
  } catch (err) {
    console.warn('[DB] syncLocalToSupabase tasks failed', err)
  }

  // Sync desabafos
  try {
    const localDesabafos = readLocalDesabafos()
    if (Array.isArray(localDesabafos) && localDesabafos.length > 0) {
      console.log(`[DB] Found ${localDesabafos.length} local desabafos to migrate`)
      let migrated = 0
      for (const d of localDesabafos) {
        try {
          const payload: any = { ...d }
          if (!payload.user_id && userId) payload.user_id = userId
          try {
            const { data: existing } = await withTimeout(
              supabase.from('desabafos').select('id').eq('id', payload.id).limit(1).single(),
            )
            if (existing && (existing as any).id) {
              console.log('[DB] desabafo exists, skipping', (existing as any).id)
              continue
            }
          } catch (e) {
            // ignore check errors and attempt create
          }
          await createDesabafo(payload)
          migrated++
        } catch (err) {
          console.warn('[DB] failed to migrate desabafo', d.id, err)
        }
      }
      try {
        if (migrated > 0) localStorage.removeItem('local:desabafos')
      } catch {}
    }
  } catch (err) {
    console.warn('[DB] syncLocalToSupabase desabafos failed', err)
  }

  // Sync events (local-only data) into a Supabase "events" table if present
  try {
    function readLocalEvents(): any[] {
      try {
        const raw = localStorage.getItem('local:events')
        if (!raw) return []
        return JSON.parse(raw)
      } catch (err) {
        console.warn('readLocalEvents failed', err)
        return []
      }
    }

    const localEvents = readLocalEvents()
    if (Array.isArray(localEvents) && localEvents.length > 0) {
      console.log(`[DB] Found ${localEvents.length} local events to migrate`)
      for (const ev of localEvents) {
        try {
          const payload: any = { ...ev }
          if (!payload.user_id && userId) payload.user_id = userId
          // Normalize date strings: ensure ISO
          if (payload.date && !(payload.date as any).endsWith?.('Z')) {
            const parsed = new Date(payload.date)
            if (!isNaN(parsed.getTime())) payload.date = parsed.toISOString()
          }

          // Try insert into events table; if table missing, inform and skip
          try {
            const { data: existing } = await withTimeout(
              supabase.from('events').select('id').eq('id', payload.id).limit(1).single(),
            )
            if (existing && (existing as any).id) {
              console.log('[DB] event exists, skipping', (existing as any).id)
              continue
            }
          } catch (e) {
            // If selecting fails because table doesn't exist, supabase client will return an error
            const msg = (e as any)?.message || String(e)
            if (/relation\s+"events"\s+does not exist/i.test(msg) || /table\s+\"events\"\s+does not exist/i.test(msg) || /Cannot read properties of undefined/i.test(msg)) {
              console.warn('[DB] Supabase events table does not exist. To migrate local events to Supabase, run the script: scripts/create_events_table.js and then re-run sync.')
              break
            }
          }

          const { data, error } = await withTimeout(
            supabase.from('events').insert(payload).select().single(),
          )
          if (error) {
            // If insert failed due to missing table, warn and stop
            const emsg = (error as any).message || JSON.stringify(error)
            if (/relation\s+"events"\s+does not exist/i.test(emsg) || /table\s+\"events\"\s+does not exist/i.test(emsg)) {
              console.warn('[DB] Supabase events table missing; run scripts/create_events_table.js then re-run syncLocalToSupabase')
              break
            }
            throw error
          }
        } catch (err) {
          console.warn('[DB] failed to migrate event', ev.id, err)
        }
      }
      try {
        localStorage.removeItem('local:events')
      } catch {}
    }
  } catch (err) {
    console.warn('[DB] syncLocalToSupabase events failed', err)
  }

  console.log('[DB] syncLocalToSupabase complete')
}
