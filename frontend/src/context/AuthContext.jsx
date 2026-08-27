import { useMemo, useState } from 'react'

import { login as apiLogin, register as apiRegister } from '../services/api'
import { AuthContext } from './AuthContextBase'
// eslint-disable-next-line react-refresh/only-export-components
export { useAuth } from './useAuth'

const LS_USER = 'rcs_user'

const roleOptions = [
  { role: 'STUDENT', label: 'Student' },
  { role: 'FACULTY', label: 'Faculty' },
  { role: 'ADMIN', label: 'Admin' },
]

function mapAuthResponse(data) {
  const role = typeof data.role === 'string' ? data.role : data.role?.name ?? data.role
  return {
    id: data.userId,
    userId: data.userId,
    name: data.name,
    email: data.email,
    role,
    token: data.token,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_USER)
      if (!raw) return null
      return JSON.parse(raw)
    } catch {
      return null
    }
  })

  const [loading, setLoading] = useState(false)

  const value = useMemo(() => {
    async function login({ email, password }) {
      setLoading(true)
      try {
        const normalizedEmail = String(email || '').trim().toLowerCase()
        if (!normalizedEmail) throw new Error('Email is required')
        if (!password) throw new Error('Password is required')

        const data = await apiLogin({ email: normalizedEmail, password })
        const u = mapAuthResponse(data)
        setUser(u)
        localStorage.setItem(LS_USER, JSON.stringify(u))
        return u
      } finally {
        setLoading(false)
      }
    }

    function logout() {
      setUser(null)
      localStorage.removeItem(LS_USER)
    }

    async function register({ name, email, password, role }) {
      setLoading(true)
      try {
        const normalizedEmail = String(email || '').trim().toLowerCase()
        if (!normalizedEmail) throw new Error('Email is required')
        if (!password) throw new Error('Password is required')

        const data = await apiRegister({
          name: String(name || '').trim() || 'User',
          email: normalizedEmail,
          password,
          role: role ?? 'STUDENT',
        })
        const u = mapAuthResponse(data)
        setUser(u)
        localStorage.setItem(LS_USER, JSON.stringify(u))
        return u
      } finally {
        setLoading(false)
      }
    }

    return {
      user,
      roleOptions,
      loading,
      login,
      logout,
      register,
    }
  }, [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
