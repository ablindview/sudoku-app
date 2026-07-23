import { createContext } from 'react'
import type { ResolvedTheme, Settings } from './settingsTypes'

export interface SettingsContextValue {
  settings: Settings
  resolvedTheme: ResolvedTheme
  updateSettings: (patch: Partial<Settings>) => void
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)
