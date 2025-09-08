import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, Filter, Send, Smile } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MessageFilters, MessageFilterValues } from '@/components/messages/MessageFilters'
import { useAuth } from '@/contexts/AuthContext'
import { Message } from '@/lib/types'
import { getConversationsForUser, getMessagesForConversation, createMessage as createMessageDb } from '@/lib/db'
import {
  conversations as mockConversations,
  messages as mockMessages,
} from '@/lib/mock-data'

const Mensagens = () => {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<any[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [filters, setFilters] = useState<Partial<MessageFilterValues>>({})

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!user) return
      try {
        const convs = await getConversationsForUser(user.id)
        if ((convs || []).length === 0) {
          // fallback to mocks
          setConversations(mockConversations)
          setMessages(mockMessages)
          setSelectedConversation(mockConversations[0])
          return
        }
        if (mounted) {
          setConversations(convs as any[])
          const first = convs[0]
          setSelectedConversation(first)
          const msgs = await getMessagesForConversation(first.id)
          setMessages(msgs as Message[])
        }
      } catch (err) {
        console.error('Failed to load conversations', err)
        setConversations(mockConversations)
        setMessages(mockMessages)
        setSelectedConversation(mockConversations[0])
      }
    })()
    return () => {
      mounted = false
    }
  }, [user])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !selectedConversation) return

    const message: Message = {
      id: `msg-${Date.now()}`,
      sender_id: user.id,
      recipient_id: selectedConversation.participant.id,
      content: newMessage,
      created_date: new Date(),
      read: false,
    }

    // optimistic
    setMessages((prev) => [...prev, message])
    setNewMessage('')

    try {
      const created = await createMessageDb(selectedConversation.id, message)
      if (!created) throw new Error('Failed to persist message')
    } catch (err) {
      console.error('Failed to persist message', err)
      // rollback
      setMessages((prev) => prev.filter((m) => m.id !== message.id))
    }
  }

  const filteredConversations = conversations.filter((c) => {
    if (
      filters.user &&
      !c.participant.name.toLowerCase().includes(filters.user.toLowerCase())
    )
      return false
    if (filters.status === 'read' && c.unread_count > 0) return false
    if (filters.status === 'unread' && c.unread_count === 0) return false
    return true
  })

  const currentMessages = messages.filter(
    (m) =>
      (m.sender_id === user?.id &&
        m.recipient_id === selectedConversation.participant.id) ||
      (m.sender_id === selectedConversation.participant.id &&
        m.recipient_id === user?.id),
  )

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-screen flex">
      <div className="w-full md:w-1/3 lg:w-1/4 border-r border-border/50 flex flex-col">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-xl font-bold font-display">Mensagens</h2>
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar conversas..." className="pl-9" />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96" align="end">
                <MessageFilters
                  onApply={setFilters}
                  onClear={() => setFilters({})}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                'flex items-center gap-4 p-4 cursor-pointer hover:bg-accent',
                selectedConversation.id === conv.id && 'bg-accent',
              )}
              onClick={() => setSelectedConversation(conv)}
            >
              <Avatar>
                <AvatarImage src={conv.participant.profile_image} />
                <AvatarFallback>
                  {conv.participant.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between">
                  <p className="font-semibold truncate">
                    {conv.participant.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(conv.last_message_date, {
                      locale: ptBR,
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.last_message_preview}
                  </p>
                  {conv.unread_count > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
      <div className="hidden md:flex flex-1 flex-col">
        <div className="p-4 border-b border-border/50 flex items-center gap-4">
          <Avatar>
            <AvatarImage src={selectedConversation.participant.profile_image} />
            <AvatarFallback>
              {selectedConversation.participant.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-bold">{selectedConversation.participant.name}</h3>
        </div>
        <ScrollArea className="flex-1 p-4 space-y-4">
          {currentMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex items-end gap-2 group',
                msg.sender_id === user?.id && 'justify-end',
              )}
            >
              {msg.sender_id !== user?.id && (
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={selectedConversation.participant.profile_image}
                  />
                  <AvatarFallback>
                    {selectedConversation.participant.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-xs lg:max-w-md p-3 rounded-lg relative',
                  msg.sender_id === user?.id
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-accent rounded-bl-none',
                )}
              >
                {msg.content}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-4 right-0 h-6 w-6 rounded-full bg-background opacity-0 group-hover:opacity-100"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </ScrollArea>
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-border/50"
        >
          <div className="relative">
            <Input
              placeholder="Digite uma mensagem..."
              className="pr-12"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <Button
              size="icon"
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default Mensagens
