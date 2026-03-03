import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  login as apiLogin,
  refresh,
  verifyToken,
  getStoredAuth,
  setStoredAuth,
  clearStoredAuth,
} from '@/shared/api/auth'

type AuthContextValue = {
  token: string | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadSession = useCallback(async () => {
    const stored = getStoredAuth()
    if (!stored) {
      setIsLoading(false)
      return
    }
    const valid = await verifyToken(stored.access_token)
    if (valid) {
      setToken(stored.access_token)
    } else {
      const refreshed = await refresh(stored.refresh_token)
      if (refreshed) {
        setStoredAuth(refreshed)
        setToken(refreshed.access_token)
      } else {
        clearStoredAuth()
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const signIn = async (email: string, password: string) => {
    try {
      const data = await apiLogin(email, password)
      setStoredAuth(data)
      setToken(data.access_token)
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Login failed') }
    }
  }

  const signOut = async () => {
    clearStoredAuth()
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
