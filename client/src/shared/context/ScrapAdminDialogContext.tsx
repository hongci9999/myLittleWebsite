import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AiToolScrapAdminDialog } from '@/widgets/AiToolScrapAdminDialog'

type OpenOpts = { slug?: string }

type ScrapAdminDialogContextValue = {
  openScrapAdmin: (opts?: OpenOpts) => void
}

const ScrapAdminDialogContext = createContext<ScrapAdminDialogContextValue | null>(
  null
)

export function ScrapAdminDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [initialSlug, setInitialSlug] = useState<string | null>(null)

  const openScrapAdmin = useCallback((opts?: OpenOpts) => {
    setInitialSlug(opts?.slug ?? null)
    setOpen(true)
  }, [])

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next)
    if (!next) setInitialSlug(null)
  }, [])

  const value = useMemo(
    () => ({
      openScrapAdmin,
    }),
    [openScrapAdmin]
  )

  return (
    <ScrapAdminDialogContext.Provider value={value}>
      {children}
      <AiToolScrapAdminDialog
        open={open}
        onOpenChange={handleOpenChange}
        initialSlug={initialSlug}
      />
    </ScrapAdminDialogContext.Provider>
  )
}

export function useScrapAdminDialog(): ScrapAdminDialogContextValue {
  const ctx = useContext(ScrapAdminDialogContext)
  if (!ctx) {
    throw new Error('useScrapAdminDialog must be used within ScrapAdminDialogProvider')
  }
  return ctx
}
