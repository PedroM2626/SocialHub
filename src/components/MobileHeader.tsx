import { Menu, Sparkles, LogOut, Tags } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Bell,
  CheckSquare,
  Compass,
  Home,
  MessageSquare,
  MessageSquareHeart,
  Users,
  User,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Separator } from './ui/separator'

const navigationItems = [
  { name: 'Início', href: '/', icon: Home },
  { name: 'Tarefas', href: '/tarefas', icon: CheckSquare },
  { name: 'Gerenciar Tags', href: '/tarefas/tags', icon: Tags },
  { name: 'Desabafos', href: '/desabafos', icon: MessageSquareHeart },
  { name: 'Explorar', href: '/explorar', icon: Compass },
  { name: 'Comunidades', href: '/comunidades', icon: Users },
  { name: 'Mensagens', href: '/mensagens', icon: MessageSquare },
  { name: 'Notificações', href: '/notificacoes', icon: Bell },
  { name: 'Perfil', href: '/perfil', icon: User },
]

export const MobileHeader = () => {
  const { logout } = useAuth()
  return (
    <header className="lg:hidden sticky top-0 z-40 flex h-14 sm:h-16 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-lg px-3 sm:px-6">
      <div className="flex items-center">
        <Sparkles className="h-6 w-auto text-primary" />
        <span className="ml-2 text-lg sm:text-xl font-bold font-display">
          SocialHub
        </span>
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Abrir menu">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-64 sm:w-72 md:w-80 bg-background p-4 flex flex-col"
        >
          <div className="flex items-center flex-shrink-0 px-4 mb-8">
            <Sparkles className="h-8 w-auto text-primary" />
            <h1 className="ml-2 text-2xl font-bold font-display text-foreground">
              SocialHub
            </h1>
          </div>
          <nav
            className="flex flex-col space-y-2 flex-1"
            aria-label="Mobile primary"
          >
            {navigationItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group',
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )
                }
              >
                <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto">
            <Separator className="my-2" />
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={logout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sair
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
