import { useState } from 'react'
import { updateDesabafoReactions, addCommentToDesabafo } from '@/lib/db'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  MessageCircle,
  MoreHorizontal,
  Smile,
  Edit,
  Trash2,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Desabafo, DesabafoComment } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Textarea } from '../ui/textarea'
import { useToast } from '../ui/use-toast'
import { Link } from 'react-router-dom'
import { Input } from '../ui/input'

interface DesabafoCardProps {
  desabafo: Desabafo
  onUpdate: (id: string, data: { content: string; hashtags: string }) => void
  onDelete: (id: string) => void
}

const reactions = ['❤️', '👍', '😂', '😢', '😠']

export const DesabafoCard = ({
  desabafo,
  onUpdate,
  onDelete,
}: DesabafoCardProps) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [editedContent, setEditedContent] = useState(desabafo.content)
  const [editedHashtags, setEditedHashtags] = useState(
    desabafo.hashtags.join(' '),
  )
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [localReactions, setLocalReactions] = useState(desabafo.reactions)
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState(desabafo.comments)
  const [newComment, setNewComment] = useState('')

  const isOwner = user?.id === desabafo.user_id

  const handleUpdate = () => {
    if (!editedContent.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'O desabafo não pode ficar vazio.',
      })
      return
    }
    onUpdate(desabafo.id, {
      content: editedContent,
      hashtags: editedHashtags,
    })
    setIsEditDialogOpen(false)
    toast({
      title: 'Sucesso!',
      description: 'Seu desabafo foi atualizado.',
    })
  }

  const handleReact = async (emoji: string) => {
    if (!user) return
    const key = `desabafo-react:${desabafo.id}:${emoji}:${user.id}`
    const already = Boolean(localStorage.getItem(key))

    // optimistic
    const previous = { ...localReactions }
    const next = { ...localReactions }
    const current = next[emoji] || 0
    next[emoji] = already ? Math.max(0, current - 1) : current + 1
    // if user had a different reaction, remove it
    if (userReaction && userReaction !== emoji) {
      next[userReaction] = Math.max(0, (next[userReaction] || 1) - 1)
    }

    setLocalReactions(next)
    setUserReaction(already ? null : emoji)

    try {
      const ok = await updateDesabafoReactions(desabafo.id, next)
      if (!ok) throw new Error('Failed to persist reaction')
      if (already) localStorage.removeItem(key)
      else localStorage.setItem(key, '1')
    } catch (err) {
      console.error('Failed to persist desabafo reaction', err)
      // rollback
      setLocalReactions(previous)
      setUserReaction(previous ? Object.keys(previous).find((k) => (previous as any)[k] > 0) || null : null)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    const comment: DesabafoComment = {
      id: `dc-${Date.now()}`,
      content: newComment,
      created_date: new Date(),
      reactions: {},
    }

    // optimistic
    setComments((prev) => [...prev, comment])
    setNewComment('')

    try {
      const ok = await addCommentToDesabafo(desabafo.id, comment)
      if (!ok) throw new Error('Failed to persist comment')
    } catch (err) {
      console.error('Failed to persist desabafo comment', err)
      // rollback
      setComments((prev) => prev.filter((c) => c.id !== comment.id))
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível publicar o comentário.' })
    }
  }

  return (
    <Card className="glass-card animate-fade-in-up">
      <CardHeader className="flex flex-row items-start p-4">
        <div>
          <p className="font-bold">Anônimo</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {formatDistanceToNow(desabafo.created_date, {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
            {desabafo.updated_at && <span>(editado)</span>}
          </div>
        </div>
        {isOwner && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <AlertDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-auto">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DialogTrigger asChild>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DropdownMenuItem
                    className="text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <AlertDialogTrigger asChild>
                      <span className="flex items-center w-full">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </span>
                    </AlertDialogTrigger>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DialogContent className="glass-card">
                <DialogHeader>
                  <DialogTitle>Editar Desabafo</DialogTitle>
                </DialogHeader>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={5}
                  className="bg-background"
                />
                <Input
                  placeholder="#hashtags"
                  value={editedHashtags}
                  onChange={(e) => setEditedHashtags(e.target.value)}
                  className="bg-background"
                />
                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="ghost">Cancelar</Button>
                  </DialogClose>
                  <Button onClick={handleUpdate}>Salvar Alterações</Button>
                </div>
              </DialogContent>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá
                    permanentemente seu desabafo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(desabafo.id)}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-2">
        <p className="whitespace-pre-wrap">{desabafo.content}</p>
        {desabafo.image_url && (
          <div className="mt-4 rounded-lg overflow-hidden border border-border/50">
            <img
              src={desabafo.image_url}
              alt="Desabafo content"
              className="w-full h-auto object-cover"
            />
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {desabafo.hashtags.map((tag) => (
            <Link
              key={tag}
              to={`/desabafos?tag=${tag.slice(1)}`}
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
            {Object.entries(localReactions)
              .sort(([, a], [, b]) => b - a)
              .map(([emoji, count]) =>
                count > 0 ? (
                  <span key={emoji}>
                    {emoji} {count}
                  </span>
                ) : null,
              )}
          </div>
          <span>{comments.length} comentários</span>
        </div>
        <Separator className="my-2 bg-border/50" />
        <div className="grid grid-cols-2 gap-1 w-full">
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
                    onClick={() => handleReact(emoji)}
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
              <div className="flex-1 relative">
                <Textarea
                  placeholder="Escreva um comentário anônimo..."
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
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <div className="bg-accent p-3 rounded-lg text-sm w-full">
                  <p className="font-bold">Anônimo</p>
                  <p>{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
