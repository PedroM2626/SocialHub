export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          cover_image_url: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          created_at: string
          content: string
          image_url: string | null
          hashtags: string[] | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          content: string
          image_url?: string | null
          hashtags?: string[] | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          content?: string
          image_url?: string | null
          hashtags?: string[] | null
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string
          content: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          created_at?: string
          content: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          created_at?: string
          content?: string
        }
      }
      reactions: {
        Row: {
          id: string
          user_id: string
          post_id: string | null
          comment_id: string | null
          desabafo_id: string | null
          emoji: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id?: string | null
          comment_id?: string | null
          desabafo_id?: string | null
          emoji: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string | null
          comment_id?: string | null
          desabafo_id?: string | null
          emoji?: string
        }
      }
      communities: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string
          image_url: string | null
          is_private: boolean
          category: string
          owner_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description: string
          image_url?: string | null
          is_private?: boolean
          category: string
          owner_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string
          image_url?: string | null
          is_private?: boolean
          category?: string
          owner_id?: string
        }
      }
      community_members: {
        Row: {
          community_id: string
          user_id: string
          joined_at: string
          role: 'admin' | 'moderator' | 'member'
        }
        Insert: {
          community_id: string
          user_id: string
          joined_at?: string
          role?: 'admin' | 'moderator' | 'member'
        }
        Update: {
          community_id?: string
          user_id?: string
          joined_at?: string
          role?: 'admin' | 'moderator' | 'member'
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          created_at: string
          title: string
          description: string | null
          is_completed: boolean
          priority: 'low' | 'medium' | 'high' | 'urgent'
          tags: string[] | null
          due_date: string | null
          start_time: string | null
          end_time: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          title: string
          description?: string | null
          is_completed?: boolean
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          tags?: string[] | null
          due_date?: string | null
          start_time?: string | null
          end_time?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          title?: string
          description?: string | null
          is_completed?: boolean
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          tags?: string[] | null
          due_date?: string | null
          start_time?: string | null
          end_time?: string | null
        }
      }
      desabafos: {
        Row: {
          id: string
          created_at: string
          content: string
          image_url: string | null
          hashtags: string[] | null
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          content: string
          image_url?: string | null
          hashtags?: string[] | null
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          content?: string
          image_url?: string | null
          hashtags?: string[] | null
          user_id?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          created_at: string
          sender_id: string
          recipient_id: string | null
          community_id: string | null
          content: string
          read: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          sender_id: string
          recipient_id?: string | null
          community_id?: string | null
          content: string
          read?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          sender_id?: string
          recipient_id?: string | null
          community_id?: string | null
          content?: string
          read?: boolean
        }
      }
      notifications: {
        Row: {
          id: string
          created_at: string
          recipient_id: string
          actor_id: string
          type: 'like' | 'comment' | 'follow' | 'community_invite'
          post_id: string | null
          read: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          recipient_id: string
          actor_id: string
          type: 'like' | 'comment' | 'follow' | 'community_invite'
          post_id?: string | null
          read?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          recipient_id?: string
          actor_id?: string
          type?: 'like' | 'comment' | 'follow' | 'community_invite'
          post_id?: string | null
          read?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
