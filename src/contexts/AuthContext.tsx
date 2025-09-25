import React, { createContext, useContext, useEffect, useState } from 'react'

interface AuthUser {
  id: string
  email: string
  role: 'admin' | 'manager' | 'agent'
}

interface DemoUser {
  id: string
  email: string
  password: string
  role: 'admin' | 'manager' | 'agent'
}

interface AuthContextType {
  user: AuthUser | null
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  loading: boolean
  changePassword: (userId: string, newPassword: string) => Promise<{ error: any }>
  timeRemaining: number
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Initialize demo users
const initializeDemoUsers = (): DemoUser[] => {
  const defaultUsers: DemoUser[] = [
    { id: 'demo-admin', email: 'admin@logicem.com', password: 'LogicemAdmin2024!', role: 'admin' },
    { id: 'demo-manager', email: 'manager@logicem.com', password: 'LogicemManager2024!', role: 'manager' },
    { id: 'demo-agent', email: 'agent@logicem.com', password: 'LogicemAgent2024!', role: 'agent' },
    { id: 'demo-agent-2', email: 'carlos@logicem.com', password: 'LogicemAgent2024!', role: 'agent' },
    { id: 'demo-agent-3', email: 'maria@logicem.com', password: 'LogicemAgent2024!', role: 'agent' },
    { id: 'demo-manager-2', email: 'sofia@logicem.com', password: 'LogicemManager2024!', role: 'manager' }
  ]
  
  const stored = localStorage.getItem('demo_auth_users')
  if (!stored) {
    localStorage.setItem('demo_auth_users', JSON.stringify(defaultUsers))
    return defaultUsers
  }
  
  return JSON.parse(stored)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes in seconds
  const [lastActivity, setLastActivity] = useState(Date.now())

  // Session timeout configuration
  const SESSION_TIMEOUT = 5 * 60 * 1000 // 5 minutes in milliseconds
  const WARNING_TIME = 60 // Show warning when 1 minute remains

  // Reset activity timer
  const resetActivityTimer = () => {
    setLastActivity(Date.now())
    setTimeRemaining(300)
  }

  // Handle user activity
  useEffect(() => {
    if (!user) return

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const handleActivity = () => {
      resetActivityTimer()
    }

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      // Remove event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [user])

  // Session timeout timer
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivity
      const remaining = Math.max(0, SESSION_TIMEOUT - timeSinceLastActivity)
      const remainingSeconds = Math.ceil(remaining / 1000)
      
      setTimeRemaining(remainingSeconds)

      if (remaining <= 0) {
        signOut()
        alert('Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.')
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [user, lastActivity])
  useEffect(() => {
    // Initialize demo users
    initializeDemoUsers()
    
    // Simple timeout to simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 100)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      // Get fresh users from localStorage
      const demoUsers = JSON.parse(localStorage.getItem('demo_auth_users') || '[]')
      
      const demoUser = demoUsers.find((u: DemoUser) => u.email === email && u.password === password)
      
      if (demoUser) {
        const authUser: AuthUser = {
          id: demoUser.id,
          email: demoUser.email,
          role: demoUser.role
        }
        setUser(authUser)
        resetActivityTimer()
        return { error: null }
      }
      
      return { error: { message: 'Credenciales inválidas' } }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    setUser(null)
    setTimeRemaining(300)
    setLastActivity(Date.now())
  }

  const changePassword = async (userId: string, newPassword: string) => {
    try {
      // Get current users
      const demoUsers = JSON.parse(localStorage.getItem('demo_auth_users') || '[]')
      
      // Update password
      const updatedUsers = demoUsers.map((u: DemoUser) => 
        u.id === userId ? { ...u, password: newPassword } : u
      )
      
      // Save updated users
      localStorage.setItem('demo_auth_users', JSON.stringify(updatedUsers))
      
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const value = {
    user,
    signIn,
    signOut,
    loading,
    changePassword,
    timeRemaining
  }


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}