import { useState } from 'react'
import { Bell, Heart, MessageCircle, User, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { users, posts } from '@/lib/mock-data'
import { Notification } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

const initialNotifications: Notification[] = [
  {
    id: 'notif-1',
    actor: users[1],
    type: 'like',
    post_id: posts[0].id,
    created_date: new Date(Date.now() - 1000 * 60 * 10),
    read: false,
  },
  {
    id: 'notif-2',
    actor: users[2],
    type: 'comment',
    post_id: posts[0].id,
    content_preview: 'Uau, parece um lugar mágico!',
    created_date: new Date(Date.now() - 1000 * 60 * 60),
    read: false,
  },
  {
    id: 'notif-3',
    actor: users[2],
    type: 'follow',
    created_date: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: true,
  },
  {
    id: 'notif-4',
    actor: users[3],
    type: 'like',
    post_id: posts[2].id,
    created_date: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
  },
]

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  switch (type) {
    case 'like':
      return <Heart className="h-5 w-5 text-red-500" />
    case 'comment':
      return <MessageCircle className="h-5 w-5 text-blue-500" />
    case 'follow':
      return <User className="h-5 w-5 text-primary" />
    default:
      return null
  }
}

const Notificacoes = () => {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications)

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-primary animate-pulse" />
            <CardTitle className="font-display text-2xl">
              Notificações
            </CardTitle>
          </div>
          <Button
            variant="link"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Marcar todas como lidas
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-lg transition-colors',
                  !notif.read && 'bg-primary/10',
                )}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={notif.actor.profile_image} />
                    <AvatarFallback>
                      {notif.actor.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full">
                    <NotificationIcon type={notif.type} />
                  </div>
                </div>
                <div className="flex-1">
                  <p>
                    <Link
                      to={`/perfil/${notif.actor.id}`}
                      className="font-bold hover:underline"
                    >
                      {notif.actor.name}
                    </Link>
                    {notif.type === 'like' && ' curtiu seu post.'}
                    {notif.type === 'comment' && ' comentou em seu post.'}
                    {notif.type === 'follow' && ' começou a seguir você.'}
                  </p>
                  {notif.content_preview && (
                    <p className="text-sm text-muted-foreground mt-1 p-2 bg-accent rounded-md">
                      "{notif.content_preview}"
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(notif.created_date, {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
                {!notif.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => markAsRead(notif.id)}
                    className="h-8 w-8"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Notificacoes
