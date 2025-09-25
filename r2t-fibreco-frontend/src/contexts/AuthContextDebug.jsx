import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(false) // Sempre false para debug

  const login = async (username, password) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok) {
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('token', data.token)
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: 'Erro de conexão' }
    }
  }

  const logout = async () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
  }

  const hasPermission = (requiredRole) => {
    if (!user) return false
    
    const roleHierarchy = {
      'user': 1,
      'supervisor': 2,
      'admin': 3
    }
    
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
  }

  const isAdmin = () => user?.role === 'admin'
  const isSupervisor = () => user?.role === 'supervisor' || user?.role === 'admin'
  const isUser = () => user?.role === 'user'

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    hasPermission,
    isAdmin,
    isSupervisor,
    isUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

