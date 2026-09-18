import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('cs_token')
    const savedUser = localStorage.getItem('cs_user')
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    // Demo: hardcoded operator credentials
    if (email === 'ops@chargezone.in' && password) {
      const mockUser = {
        id: 1,
        operator_id: 1,
        name: 'Rajesh Kumar',
        email: 'ops@chargezone.in',
        role: 'Operator Admin',
        company: 'ChargeZone Pvt Ltd',
        zone: 'Bengaluru South',
        avatar: 'RK',
      }
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo.token'
      localStorage.setItem('cs_token', mockToken)
      localStorage.setItem('cs_user', JSON.stringify(mockUser))
      setUser(mockUser)
      setIsAuthenticated(true)
      return { success: true }
    }
    return { success: false, message: 'Invalid credentials. Use ops@chargezone.in' }
  }

  const logout = () => {
    localStorage.removeItem('cs_token')
    localStorage.removeItem('cs_user')
    setUser(null)
    setIsAuthenticated(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
