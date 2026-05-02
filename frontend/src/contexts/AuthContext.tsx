import { useState, type ReactNode } from 'react'
import { AuthContext, type User } from './auth-context'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('jwt'))
  const [user, setUser] = useState<User | null>(() => {
    const t = localStorage.getItem('jwt')
    const e = localStorage.getItem('jwt_email')
    return t && e ? { email: e } : null
  })

  const fetchMe = async (jwt: string): Promise<User | null> => {
    try {
      const res = await fetch(`${BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      })
      if (!res.ok) return null
      const data = await res.json()
      return {
        email: data.email,
        displayName: data.displayName,
        subscribed: data.subscribed,
        hasAccess: data.hasAccess,
        trialEndsAt: data.trialEndsAt,
      }
    } catch {
      return null
    }
  }

  const persist = async (jwt: string, email: string) => {
    localStorage.setItem('jwt', jwt)
    localStorage.setItem('jwt_email', email)
    setToken(jwt)
    const me = await fetchMe(jwt)
    setUser(me ?? { email })
  }

  const refreshMe = async () => {
    const jwt = localStorage.getItem('jwt')
    if (!jwt) return
    const me = await fetchMe(jwt)
    if (me) setUser(me)
  }

  const login = async (email: string, password: string) => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message ?? `Login failed (${res.status})`)
    }
    const { token: jwt } = await res.json()
    await persist(jwt, email)
  }

  const register = async (email: string, password: string, displayName: string) => {
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message ?? `Registration failed (${res.status})`)
    }
    const { token: jwt } = await res.json()
    await persist(jwt, email)
  }

  const logout = () => {
    localStorage.removeItem('jwt')
    localStorage.removeItem('jwt_email')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  )
}
