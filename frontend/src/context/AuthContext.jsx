import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import Api, { tokenStore } from '../lib/api'

const AuthCtx = createContext(null)
const USER_KEY = 'cat_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(!!tokenStore.get())

  // validasi token sekali saat aplikasi dibuka
  useEffect(() => {
    let alive = true
    if (!tokenStore.get()) {
      setLoading(false)
      return
    }
    Api.me()
      .then((res) => {
        if (!alive) return
        setUser(res.user)
        localStorage.setItem(USER_KEY, JSON.stringify(res.user))
      })
      .catch(() => {
        if (!alive) return
        tokenStore.clear()
        localStorage.removeItem(USER_KEY)
        setUser(null)
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const login = useCallback(async (username, password, role) => {
    const res = await Api.login({ username, password, role })
    tokenStore.set(res.token)
    localStorage.setItem(USER_KEY, JSON.stringify(res.user))
    setUser(res.user)
    return res.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await Api.logout()
    } catch {
      /* token mungkin sudah mati — abaikan */
    }
    tokenStore.clear()
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  return ctx
}
