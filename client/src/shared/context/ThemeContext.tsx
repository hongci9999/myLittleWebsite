import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type ThemeId = 'blue-orange' | 'amber-cyan' | 'dark-slate'

const THEME_STORAGE_KEY = 'mylittlewebsite-theme'

const ThemeContext = createContext<{
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
} | null>(null)

function getStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return 'blue-orange'
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (
    stored === 'blue-orange' ||
    stored === 'amber-cyan' ||
    stored === 'dark-slate'
  ) {
    return stored
  }
  return 'blue-orange'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(getStoredTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const setTheme = (next: ThemeId) => setThemeState(next)

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
