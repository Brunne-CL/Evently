import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  apiLogin,
  apiRegister,
  apiLogout,
  apiMe,
  apiPinLogin,
  apiSetPin,
  apiUpdateProfile,
  getCachedUser,
  getToken,
  clearSession,
} from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCachedUser())
  const [booting, setBooting] = useState(() => Boolean(getToken()))

  useEffect(() => {
    let cancelled = false
    async function restore() {
      const token = getToken()
      if (!token) {
        setBooting(false)
        return
      }
      const data = await apiMe()
      if (cancelled) return
      if (data.ok) {
        setUser(data.user)
      } else {
        setUser(null)
        clearSession()
      }
      setBooting(false)
    }
    restore()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const result = await apiLogin(credentials)
    if (result.ok) setUser(result.user)
    return result
  }, [])

  const register = useCallback(async (data) => {
    const result = await apiRegister(data)
    if (result.ok) setUser(result.user)
    return result
  }, [])

  const loginWithPin = useCallback(async (payload) => {
    const result = await apiPinLogin(payload)
    if (result.ok) setUser(result.user)
    return result
  }, [])

  const updateProfile = useCallback(async (payload) => {
    const result = await apiUpdateProfile(payload)
    if (result.ok) setUser(result.user)
    return result
  }, [])

  const setPin = useCallback(async (payload) => {
    const result = await apiSetPin(payload)
    if (result.ok && result.user) setUser(result.user)
    return result
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        loginWithPin,
        updateProfile,
        setPin,
        logout,
        isAuthenticated: !!user,
        booting,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return ctx
}
