import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types'
import { authApi } from '../services/api'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, firstName?: string, lastName?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      // Validate token and get user info
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      // TODO: Implement get current user API
      setLoading(false)
    } catch {
      logout()
    }
  }

  const login = async (username: string, password: string) => {
    const response = await authApi.login(username, password)
    if (response.success && response.data) {
      const authData = response.data as any
      localStorage.setItem('token', authData.token)
      setToken(authData.token)
      setUser(authData.user)
    } else {
      throw new Error(response.message)
    }
  }

  const register = async (username: string, email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const response = await authApi.register({ username, email, password, firstName, lastName })
      if (response.success && response.data) {
        const authData = response.data as any
        localStorage.setItem('token', authData.token)
        setToken(authData.token)
        setUser(authData.user)
      } else {
        const error: any = new Error(response.message)
        error.response = { data: { message: response.message, errors: response.errors } }
        throw error
      }
    } catch (err: any) {
      // Preserve axios error response
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
