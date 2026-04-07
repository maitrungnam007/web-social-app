import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types'
import { authApi } from '../services'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, firstName?: string, lastName?: string) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem(USER_KEY)
    return storedUser ? JSON.parse(storedUser) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login(username, password)
      console.log('Login response:', response)
      if (response.success && response.data) {
        const authData = response.data as any
        console.log('authData:', authData)
        const userData = authData.user || authData.User
        const tokenValue = authData.token || authData.Token
        console.log('userData:', userData)
        console.log('userData.role:', userData?.role)
        
        // Normalize role field (backend returns 'Role', frontend expects 'role')
        if (userData && userData.Role && !userData.role) {
          userData.role = userData.Role
        }
        
        localStorage.setItem(TOKEN_KEY, tokenValue)
        localStorage.setItem(USER_KEY, JSON.stringify(userData))
        setToken(tokenValue)
        setUser(userData)
      }
    } catch (err: any) {
      // Axios throw error khi status 401
      // Lay message tu response.data
      const message = err.response?.data?.message || err.message || 'Đăng nhập thất bại'
      throw new Error(message)
    }
  }

  const register = async (username: string, email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const response = await authApi.register({ username, email, password, firstName, lastName })
      if (response.success && response.data) {
        const authData = response.data as any
        const userData = authData.user || authData.User
        const tokenValue = authData.token || authData.Token
        
        // Normalize role field (backend returns 'Role', frontend expects 'role')
        if (userData && userData.Role && !userData.role) {
          userData.role = userData.Role
        }
        
        localStorage.setItem(TOKEN_KEY, tokenValue)
        localStorage.setItem(USER_KEY, JSON.stringify(userData))
        setToken(tokenValue)
        setUser(userData)
      }
    } catch (err: any) {
      // Axios throw error khi status 400/401
      const message = err.response?.data?.message || err.message || 'Đăng ký thất bại'
      throw new Error(message)
    }
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null
      const updatedUser = { ...prev, ...userData }
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser))
      return updatedUser
    })
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
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
