export interface User {
  id: string
  name: string
  email: string
  profile_image: string
  cover_image: string
  bio: string
  posts_count: number
  followers_count: number
  following_count: number
  website?: string
  interests?: string[]
}

export interface Comment {
  id: string
  author: User
  content: string
  created_date: Date
  likes_count: number
}

export interface Post {
  id: string
  author: User
  created_date: Date
  content: string
  image_url?: string | null
  hashtags: string[]
  likes_count: number
  comments_count: number
  comments: Comment[]
  reactions: Record<string, number>
  updated_at?: Date
}

export interface Notification {
  id: string
  actor: User
  type: 'like' | 'comment' | 'follow'
  post_id?: string
  content_preview?: string
  created_date: Date
  read: boolean
}

export interface Community {
  id: string
  name: string
  description: string
  image_url: string
  members_count: number
  is_private: boolean
  category: string
  created_date: Date
}

export interface Subtask {
  id: string
  title: string
  is_completed: boolean
  subtasks?: Subtask[]
}

export type TaskBorderStyle =
  | 'none'
  | 'solid'
  | 'dashed'
  | 'dotted'
  | 'double'
  | 'groove'
  | 'ridge'
  | 'inset'
  | 'outset'

export interface Attachment {
  id: string
  name: string
  url: string
  size: number // in bytes
  type: string
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Task {
  id: string
  title: string
  description: string
  is_completed: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  is_public: boolean
  tags: Tag[]
  due_date?: Date
  subtasks: Subtask[]
  backgroundColor: string
  borderStyle: TaskBorderStyle
  attachments: Attachment[]
  titleAlignment?: 'left' | 'center' | 'right'
  descriptionAlignment?: 'left' | 'center' | 'right'
}

export interface Desabafo {
  id: string
  user_id?: string
  created_date: Date
  content: string
  image_url?: string
  hashtags: string[]
  reactions: Record<string, number>
  comments: DesabafoComment[]
  updated_at?: Date
}

export interface DesabafoComment {
  id: string
  content: string
  created_date: Date
  reactions: Record<string, number>
}

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  created_date: Date
  read: boolean
  reactions?: Record<string, number>
}

export interface CommunityMessage {
  id: string
  community_id: string
  author: User
  content: string
  created_date: Date
  reactions?: Record<string, number>
}

export interface Conversation {
  id: string
  participant: User
  last_message_preview: string
  last_message_date: Date
  unread_count: number
}
