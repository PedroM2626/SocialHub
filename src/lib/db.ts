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
    const { data, error } = await withTimeout(supabase.from('users').select('*'))
    if (error) throw error
    return (data || []) as User[]
  } catch (err) {
    console.warn('getUsers fallback to empty array', err)
    return []
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const { data, error } = await withTimeout(supabase.from('users').select('*').eq('id', id).limit(1).single())
    if (error) throw error
    return data as User
  } catch (err) {
    console.warn('getUserById failed', err)
    return null
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await withTimeout(supabase.from('users').select('*').eq('email', email).limit(1).single())
    if (error) throw error
    return data as User
  } catch (err) {
    console.warn('getUserByEmail failed', err)
    return null
  }
}

export async function createUser(payload: Partial<User>): Promise<User | null> {
  try {
    const { data, error } = await withTimeout(supabase.from('users').insert(payload).select().single())
    if (error) throw error
    return data as User
  } catch (err) {
    console.warn('createUser failed', err)
    return null
  }
}

export async function getPosts(): Promise<Post[]> {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_date', { ascending: false })
    if (error) throw error
    const postsArr = (posts || []) as any[]

    // fetch authors
    const userIds = Array.from(new Set(postsArr.map((p) => p.author_id).filter(Boolean)))
    let usersMap: Record<string, User> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase.from('users').select('*').in('id', userIds)
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
    const { data, error } = await supabase.from('posts').insert(record).select().single()
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

export async function updateUser(id: string, payload: Partial<User>): Promise<User | null> {
  try {
    const { data, error } = await supabase.from('users').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data as User
  } catch (err) {
    console.warn('updateUser failed', err)
    return null
  }
}
