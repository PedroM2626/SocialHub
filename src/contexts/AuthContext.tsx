import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { User as AppUser } from '@/lib/types'
import { getUserById, getUsers, getUserByEmail, createUser, updateUser } from '@/lib/db'

interface MockSession {
  user: {
    id: string
    email: string
  }
  expires_at: number
}

interface AuthContextType {
  isAuthenticated: boolean
  user: AppUser | null
  session: MockSession | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  updateUser: (updatedData: Partial<AppUser>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null)
  const [session, setSession] = useState<MockSession | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const AUTO_LOGIN = import.meta.env.VITE_AUTO_LOGIN === 'true'

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const sessionStr = localStorage.getItem('socialhub_session')

        if (sessionStr) {
          const savedSession: MockSession = JSON.parse(sessionStr)
          if (savedSession.expires_at > Date.now()) {
            const dbUser = await getUserById(savedSession.user.id)
            if (dbUser && mounted) {
              setUser(dbUser)
              setSession(savedSession)
            } else if (mounted) {
              localStorage.removeItem('socialhub_session')
            }
          } else if (mounted) {
            localStorage.removeItem('socialhub_session')
          }
        } else if (AUTO_LOGIN) {
          const allUsers = await getUsers()
          if (allUsers.length > 0 && mounted) {
            const defaultUser = allUsers[0]
            const newSession: MockSession = {
              user: { id: defaultUser.id, email: defaultUser.email },
              expires_at: Date.now() + 1000 * 60 * 60 * 24,
            }
            localStorage.setItem('socialhub_session', JSON.stringify(newSession))
            setUser(defaultUser)
            setSession(newSession)
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth state:', error)
        localStorage.removeItem('socialhub_session')
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const login = async (email: string, password: string) => {
    // Password is not validated in this mock flow; rely on DB presence
    const foundUser = await getUserByEmail(email)
    if (foundUser) {
      const newSession: MockSession = {
        user: { id: foundUser.id, email: foundUser.email },
        expires_at: Date.now() + 3600 * 1000,
      }
      localStorage.setItem('socialhub_session', JSON.stringify(newSession))
      setUser(foundUser)
      setSession(newSession)
      navigate('/')
    } else {
      throw new Error('Invalid email or password')
    }
  }

  const register = async (name: string, email: string, password: string) => {
    const existing = await getUserByEmail(email)
    if (existing) throw new Error('An account with this email already exists.')
    const newUser = await createUser({
      id: `user-${Date.now()}`,
      name,
      email,
      profile_image: `https://img.usecurling.com/ppl/medium?seed=${email}`,
      cover_image: 'https://img.usecurling.com/p/1200/400?q=colorful%20abstract',
      bio: 'Novo membro do SocialHub!',
      posts_count: 0,
      followers_count: 0,
      following_count: 0,
    })
    if (!newUser) throw new Error('Failed to create user')

    const newSession: MockSession = {
      user: { id: newUser.id, email: newUser.email },
      expires_at: Date.now() + 3600 * 1000,
    }
    localStorage.setItem('socialhub_session', JSON.stringify(newSession))
    setUser(newUser)
    setSession(newSession)
    navigate('/')
  }

  const logout = async () => {
    localStorage.removeItem('socialhub_session')
    setUser(null)
    setSession(null)
    navigate('/login')
  }

  const updateUserHandler = async (updatedData: Partial<AppUser>) => {
    if (!user) return
    const updated = await updateUser(user.id, updatedData)
    if (updated) setUser(updated)
  }

  const value: AuthContextType = {
    isAuthenticated: !!user && !!session,
    user,
    session,
    login,
    logout,
    register,
    updateUser: updateUserHandler,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
