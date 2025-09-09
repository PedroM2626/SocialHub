import {
  Bell,
  CheckSquare,
  Compass,
  Home,
  MessageSquare,
  MessageSquareHeart,
  Users,
  User,
  Sparkles,
  LogOut,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { Separator } from './ui/separator'

const navigationItems = [
  { name: 'Início', href: '/', icon: Home },
  { name: 'Tarefas', href: '/tarefas', icon: CheckSquare },
  { name: 'Desabafos', href: '/desabafos', icon: MessageSquareHeart },
  { name: 'Explorar', href: '/explorar', icon: Compass },
  { name: 'Comunidades', href: '/comunidades', icon: Users },
  { name: 'Mensagens', href: '/mensagens', icon: MessageSquare },
  { name: 'Notificações', href: '/notificacoes', icon: Bell },
  { name: 'Perfil', href: '/perfil', icon: User },
]

export const AppSidebar = () => {
  const { logout } = useAuth()

  return (
    <aside
      role="navigation"
      aria-label="Main navigation"
      className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-border/50 lg:bg-background z-50"
    >
      <div className="flex flex-col flex-grow p-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-8">
          <Sparkles className="h-8 w-auto text-primary animate-pulse-sm" />
          <h1 className="ml-2 text-2xl font-bold font-display text-foreground">
            SocialHub
          </h1>
        </div>

        <nav className="flex-1 space-y-2" aria-label="Primary">
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group hover:scale-105',
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg scale-105'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-4">
          <Separator className="mb-4" />
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={logout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sair
          </Button>
        </div>
      </div>
    </aside>
  )
}
