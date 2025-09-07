import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { User as AppUser } from '@/lib/types'
import { users as mockUsers } from '@/lib/mock-data'

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
  updateUser: (updatedData: Partial<AppUser>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null)
  const [session, setSession] = useState<MockSession | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    try {
      const sessionStr = localStorage.getItem('socialhub_session')
      if (sessionStr) {
        const savedSession: MockSession = JSON.parse(sessionStr)
        if (savedSession.expires_at > Date.now()) {
          const loggedInUser = mockUsers.find(
            (u) => u.id === savedSession.user.id,
          )
          if (loggedInUser) {
            setUser(loggedInUser)
            setSession(savedSession)
          }
        } else {
          localStorage.removeItem('socialhub_session')
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth state:', error)
      localStorage.removeItem('socialhub_session')
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const foundUser = mockUsers.find((u) => u.email === email)
    if (foundUser) {
      const newSession: MockSession = {
        user: { id: foundUser.id, email: foundUser.email },
        expires_at: Date.now() + 3600 * 1000, // 1 hour
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
    if (mockUsers.some((u) => u.email === email)) {
      throw new Error('An account with this email already exists.')
    }
    const newUser: AppUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      profile_image: `https://img.usecurling.com/ppl/medium?seed=${email}`,
      cover_image:
        'https://img.usecurling.com/p/1200/400?q=colorful%20abstract',
      bio: 'Novo membro do SocialHub!',
      posts_count: 0,
      followers_count: 0,
      following_count: 0,
    }
    mockUsers.push(newUser)

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

  const updateUser = (updatedData: Partial<AppUser>) => {
    if (user) {
      const updatedUser = { ...user, ...updatedData }
      setUser(updatedUser)
      const userIndex = mockUsers.findIndex((u) => u.id === user.id)
      if (userIndex !== -1) {
        mockUsers[userIndex] = updatedUser
      }
    }
  }

  const value = {
    isAuthenticated: !!user && !!session,
    user,
    session,
    login,
    logout,
    register,
    updateUser,
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
