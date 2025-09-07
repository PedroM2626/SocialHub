import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Send, Smile } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { Community, CommunityMessage } from '@/lib/types'
import {
  communities as mockCommunities,
  communityMessages as mockCommunityMessages,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const ComunidadeChat = () => {
  const { communityId } = useParams<{ communityId: string }>()
  const { user } = useAuth()
  const [community, setCommunity] = useState<Community | null>(null)
  const [messages, setMessages] = useState<CommunityMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!communityId) return
      setLoading(true)
      await new Promise((res) => setTimeout(res, 500))

      const foundCommunity = mockCommunities.find((c) => c.id === communityId)
      const communityMessages = mockCommunityMessages.filter(
        (m) => m.community_id === communityId,
      )

      setCommunity(foundCommunity || null)
      setMessages(communityMessages)
      setLoading(false)
    }
    fetchData()
  }, [communityId])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !community) return

    const message: CommunityMessage = {
      id: `cmsg-${Date.now()}`,
      community_id: community.id,
      author: user,
      content: newMessage,
      created_date: new Date(),
    }
    setMessages((prev) => [...prev, message])
    setNewMessage('')
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <Skeleton className="h-16 w-full" />
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-12 w-1/2 self-end" />
          <Skeleton className="h-16 w-2/3" />
        </div>
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  if (!community) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl">Comunidade não encontrada.</h1>
        <Button asChild className="mt-4">
          <Link to="/comunidades">Voltar para Comunidades</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-screen flex flex-col">
      <header className="p-4 border-b border-border/50 flex items-center gap-4">
        <Avatar>
          <AvatarImage src={community.image_url} />
          <AvatarFallback>{community.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-bold">{community.name}</h2>
          <p className="text-xs text-muted-foreground">
            {community.members_count} membros
          </p>
        </div>
      </header>
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex items-start gap-3',
                msg.author.id === user?.id && 'flex-row-reverse',
              )}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={msg.author.profile_image} />
                <AvatarFallback>{msg.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  'max-w-xs lg:max-w-md p-3 rounded-lg',
                  msg.author.id === user?.id
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-accent rounded-bl-none',
                )}
              >
                <div className="flex items-baseline gap-2">
                  <p className="font-bold text-sm">{msg.author.name}</p>
                  <time className="text-xs opacity-70">
                    {format(msg.created_date, 'HH:mm', { locale: ptBR })}
                  </time>
                </div>
                <p className="mt-1">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <footer className="p-4 border-t border-border/50">
        <form onSubmit={handleSendMessage} className="relative">
          <Input
            placeholder="Digite uma mensagem..."
            className="pr-20"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <Button variant="ghost" size="icon" type="button">
              <Smile className="h-5 w-5" />
            </Button>
            <Button size="icon" type="submit" disabled={!newMessage.trim()}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </footer>
    </div>
  )
}
export default ComunidadeChat
