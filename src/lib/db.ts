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
    const { data: posts, error } = await withTimeout(
      supabase.from('posts').select('*').order('created_date', { ascending: false }),
    )
    if (error) throw error
    const postsArr = (posts || []) as any[]

    // fetch authors
    const userIds = Array.from(new Set(postsArr.map((p) => p.author_id).filter(Boolean)))
    let usersMap: Record<string, User> = {}
    if (userIds.length > 0) {
      const { data: users } = await withTimeout(supabase.from('users').select('*').in('id', userIds))
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
    const { data, error } = await withTimeout(supabase.from('posts').insert(record).select().single())
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
    const { data, error } = await withTimeout(supabase.from('users').update(payload).eq('id', id).select().single())
    if (error) throw error
    return data as User
  } catch (err) {
    console.warn('updateUser failed', err)
    return null
  }
}

export async function addCommentToPost(postId: string, comment: any): Promise<boolean> {
  try {
    // Fetch existing comments
    const { data: post, error: fetchErr } = await withTimeout(
      supabase.from('posts').select('comments').eq('id', postId).single(),
    )
    if (fetchErr) throw fetchErr
    const existingComments = post?.comments || []
    const newComments = [...existingComments, comment]
    const { error } = await withTimeout(
      supabase.from('posts').update({ comments: newComments, comments_count: newComments.length }).eq('id', postId),
    )
    if (error) throw error
    return true
  } catch (err) {
    console.warn('addCommentToPost failed', err)
    return false
  }
}

export async function updatePostReactions(postId: string, reactions: Record<string, number>): Promise<boolean> {
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

export async function deletePost(postId: string): Promise<boolean> {
  try {
    const { error } = await withTimeout(supabase.from('posts').delete().eq('id', postId))
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
      supabase.from('conversations').select('*').or(`participant_id.eq.${userId}`),
    )
    if (error) throw error
    return (data || [])
  } catch (err) {
    console.warn('getConversationsForUser failed', err)
    return []
  }
}

export async function getMessagesForConversation(conversationId: string) {
  try {
    const { data, error } = await withTimeout(
      supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_date', { ascending: true }),
    )
    if (error) throw error
    return (data || [])
  } catch (err) {
    console.warn('getMessagesForConversation failed', err)
    return []
  }
}

export async function createMessage(conversationId: string, message: any) {
  try {
    console.log('[DB] createMessage', { conversationId, message })
    const { data, error } = await withTimeout(
      supabase.from('messages').insert({ ...message, conversation_id: conversationId }).select().single(),
    )
    if (error) {
      console.warn('[DB] createMessage insert error', error)
      // if conversation missing (FK) try to create conversation and retry
      const errMsg = (error as any).message || ''
      if (errMsg.toLowerCase().includes('foreign key') || errMsg.toLowerCase().includes('constrain') || (error as any).code === '23503') {
        console.log('[DB] createMessage: missing conversation, creating one and retrying')
        try {
          await withTimeout(
            supabase.from('conversations').insert({ id: conversationId, participant_id: message.recipient_id, last_message_preview: message.content, last_message_date: message.created_date }).select(),
          )
          const { data: data2, error: error2 } = await withTimeout(
            supabase.from('messages').insert({ ...message, conversation_id: conversationId }).select().single(),
          )
          if (error2) throw error2
          // update conversation preview
          await withTimeout(
            supabase.from('conversations').update({ last_message_preview: message.content, last_message_date: message.created_date }).eq('id', conversationId),
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
      supabase.from('conversations').update({ last_message_preview: message.content, last_message_date: message.created_date }).eq('id', conversationId),
    )
    return data
  } catch (err) {
    console.warn('createMessage failed', err)
    return null
  }
}

export async function createConversation(conversation: any) {
  try {
    const { data, error } = await withTimeout(supabase.from('conversations').insert(conversation).select().single())
    if (error) throw error
    return data
  } catch (err) {
    console.warn('createConversation failed', err)
    return null
  }
}
