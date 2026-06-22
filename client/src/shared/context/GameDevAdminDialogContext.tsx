import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { GameDevAdminDialog } from '@/widgets/GameDevAdminDialog'

type OpenOpts = { slug?: string }

type GameDevAdminDialogContextValue = {
  openGameDevAdmin: (opts?: OpenOpts) => void
}

const GameDevAdminDialogContext = createContext<GameDevAdminDialogContextValue | null>(
  null
)

export function GameDevAdminDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [initialSlug, setInitialSlug] = useState<string | null>(null)

  const openGameDevAdmin = useCallback((opts?: OpenOpts) => {
    setInitialSlug(opts?.slug ?? null)
    setOpen(true)
  }, [])

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next)
    if (!next) setInitialSlug(null)
  }, [])

  const value = useMemo(
    () => ({
      openGameDevAdmin,
    }),
    [openGameDevAdmin]
  )

  return (
    <GameDevAdminDialogContext.Provider value={value}>
      {children}
      <GameDevAdminDialog
        open={open}
        onOpenChange={handleOpenChange}
        initialSlug={initialSlug}
      />
    </GameDevAdminDialogContext.Provider>
  )
}

export function useGameDevAdmin(): GameDevAdminDialogContextValue {
  const ctx = useContext(GameDevAdminDialogContext)
  if (!ctx) {
    throw new Error('useGameDevAdmin must be used within GameDevAdminDialogProvider')
  }
  return ctx
}
