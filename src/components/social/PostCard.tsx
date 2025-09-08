import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Smile,
  Trash2,
  Edit,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Post, Comment } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { addCommentToPost, updatePostReactions, deletePost } from '@/lib/db'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog'

interface PostCardProps {
  post: Post
  onDelete?: (postId: string) => void
  onReact?: (postId: string) => void
}

const reactions = ['❤️', '👍', '😂', '😢', '😠']

export const PostCard = ({ post, onDelete, onReact }: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState(post.comments)
  const [newComment, setNewComment] = useState('')
  const { user } = useAuth()

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      author: user,
      content: newComment,
      created_date: new Date(),
      likes_count: 0,
    }

    // optimistic update
    setComments((prev) => [...prev, comment])
    setNewComment('')

    try {
      const ok = await addCommentToPost(post.id, comment)
      if (!ok) throw new Error('Failed to persist comment')
    } catch (err) {
      console.error('Failed to persist comment', err)
      // rollback
      setComments((prev) => prev.filter((c) => c.id !== comment.id))
    }
  }

  useEffect(() => {
    if (!user) return
    try {
      const key = `post-like:${post.id}:${user.id}`
      const stored = localStorage.getItem(key)
      setIsLiked(Boolean(stored))
    } catch (err) {
      // ignore
    }
  }, [user, post.id])

  const handleToggleLike = async () => {
    if (!user) return
    const key = `post-like:${post.id}:${user.id}`
    const currentlyLiked = Boolean(localStorage.getItem(key))
    const newLiked = !currentlyLiked

    // optimistic UI
    setIsLiked(newLiked)

    const nextReactions = { ...(post.reactions || {}) }
    const likeKey = '👍'
    const current = nextReactions[likeKey] || 0
    nextReactions[likeKey] = newLiked ? current + 1 : Math.max(0, current - 1)

    try {
      const ok = await updatePostReactions(post.id, nextReactions)
      if (!ok) throw new Error('Failed to persist reactions')
      post.reactions = nextReactions
      if (newLiked) localStorage.setItem(key, '1')
      else localStorage.removeItem(key)
      if (typeof onReact === 'function') onReact(post.id)
    } catch (err) {
      console.error('Failed to persist reactions', err)
      // rollback UI
      setIsLiked(currentlyLiked)
    }
  }

  const handleReactEmoji = async (emoji: string) => {
    if (!user) return
    const nextReactions = { ...(post.reactions || {}) }
    const current = nextReactions[emoji] || 0
    nextReactions[emoji] = current + 1

    try {
      const ok = await updatePostReactions(post.id, nextReactions)
      if (!ok) throw new Error('Failed to persist reactions')
      post.reactions = nextReactions
      if (typeof onReact === 'function') onReact(post.id)
    } catch (err) {
      console.error('Failed to persist reaction', err)
    }
  }

  return (
    <Card className="glass-card animate-fade-in-up">
      <CardHeader className="flex flex-row items-start p-4">
        <div className="flex items-center gap-4">
          <Link to={`/perfil/${post.author.id}`} className="block">
            <Avatar>
              <AvatarImage
                src={post.author.profile_image}
                alt={post.author.name}
              />
              <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link
              to={`/perfil/${post.author.id}`}
              className="font-bold hover:underline"
            >
              {post.author.name}
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {formatDistanceToNow(post.created_date, {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
              {post.updated_at && <span>(editado)</span>}
            </div>
          </div>
        </div>
        {user?.id === post.author.id && (
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-auto">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente
                  seu post.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={async () => {
                    const ok = await deletePost(post.id)
                    if (ok) onDelete?.(post.id)
                  }}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-2">
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.image_url && (
          <div className="mt-4 rounded-lg overflow-hidden border border-border/50">
            <img
              src={post.image_url}
              alt="Post content"
              className="w-full h-auto object-cover"
            />
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {post.hashtags.map((tag) => (
            <Link
              key={tag}
              to={`/explorar?q=${tag.slice(1)}`}
              className="text-sm text-primary hover:underline"
            >
              {tag}
            </Link>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start p-4">
        <div className="flex justify-between w-full text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            {Object.entries(post.reactions).map(([emoji, count]) => (
              <span key={emoji}>
                {emoji} {count}
              </span>
            ))}
          </div>
          <span>{comments.length} comentários</span>
        </div>
        <Separator className="my-2 bg-border/50" />
        <div className="grid grid-cols-3 gap-1 w-full">
          <Button variant="ghost" onClick={handleToggleLike}>
            <Heart
              className={cn(
                'mr-2 h-4 w-4',
                isLiked && 'fill-red-500 text-red-500',
              )}
            />
            Curtir
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Comentar
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost">
                <Smile className="mr-2 h-4 w-4" />
                Reagir
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1 rounded-full glass-card">
              <div className="flex gap-1">
                {reactions.map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-xl"
                    onClick={() => handleReactEmoji(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {showComments && (
          <div className="w-full mt-4 space-y-4">
            <form
              onSubmit={handleCommentSubmit}
              className="flex items-start space-x-3"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profile_image} />
                <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 relative">
                <Textarea
                  placeholder="Escreva um comentário..."
                  className="bg-background pr-12"
                  rows={1}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  disabled={!newComment.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
            {comments.map((comment) => {
              const author = comment.author || null
              const authorName = author?.name ?? 'Usuário'
              const authorId = author?.id ?? null

              return (
                <div key={comment.id} className="flex items-start space-x-3">
                  {authorId ? (
                    <Link to={`/perfil/${authorId}`} className="block h-8 w-8">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={author?.profile_image} />
                        <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Link>
                  ) : (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={author?.profile_image} />
                      <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}

                  <div className="bg-accent p-3 rounded-lg text-sm">
                    {authorId ? (
                      <Link
                        to={`/perfil/${authorId}`}
                        className="font-bold hover:underline"
                      >
                        {authorName}
                      </Link>
                    ) : (
                      <span className="font-bold">{authorName}</span>
                    )}
                    <p>{comment.content}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
