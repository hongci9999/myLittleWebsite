import type { ThemeId } from '@/shared/context/ThemeContext'

export const THEME_OPTIONS: { id: ThemeId; label: string }[] = [
  { id: 'blue-orange', label: '메인' },
  { id: 'amber-cyan', label: '서브' },
  { id: 'dark-slate', label: '다크' },
]
