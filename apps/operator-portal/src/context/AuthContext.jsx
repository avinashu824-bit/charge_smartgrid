import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const VALID_CREDENTIALS = {
  'operator@discom.gov.in': { password: 'operator123', name: 'Rajesh Kumar', role: 'Operator Admin', company: 'ChargeSmart Pvt Ltd', zone: 'Bengaluru South', avatar: 'RK' },
  'ops@chargezone.in':      { password: 'ops123',      name: 'Priya Nair',   role: 'Station Manager', company: 'ChargeZone Pvt Ltd', zone: 'Bengaluru North', avatar: 'PN' },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('op_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
        setIsAuthenticated(true)
      } catch (e) {
        localStorage.removeItem('op_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const cred = VALID_CREDENTIALS[email]
    if (cred && cred.password === password) {
      const mockUser = {
        id: 1,
        operator_id: 1,
        name: cred.name,
        email,
        role: cred.role,
        company: cred.company,
        zone: cred.zone,
        avatar: cred.avatar,
      }
      localStorage.setItem('op_user', JSON.stringify(mockUser))
      setUser(mockUser)
      setIsAuthenticated(true)
      return { success: true }
    }
    return { success: false, message: 'Invalid credentials. Use operator@discom.gov.in / operator123' }
  }

  const logout = () => {
    localStorage.removeItem('op_user')
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
