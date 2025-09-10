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
    let query = supabase.from('tasks').select('*').order('id', { ascending: false })
    if (userId) query = query.eq('user_id', userId)
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
    backgroundColor: payload.backgroundColor || null,
    borderStyle: payload.borderStyle || null,
  }
  if (payload.user_id) record.user_id = payload.user_id

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
    let query = supabase.from('tasks').update(payload).eq('id', id)
    if (userId) query = query.eq('user_id', userId)
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
    if (userId) query = query.eq('user_id', userId)
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
