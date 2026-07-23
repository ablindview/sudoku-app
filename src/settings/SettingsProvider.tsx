import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { SettingsContext } from './settingsContext'
import { applyCellSizeScale, applyResolvedTheme } from './domEffects'
import { readMediaQueryPrefs, resolveTheme, type MediaQueryPrefs } from './themeResolution'
import { sanitizeSettings, SETTINGS_STORAGE_KEY, type Settings } from './settingsTypes'
import { readJSON, writeJSON } from '../utils/localStorage'

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => sanitizeSettings(readJSON(SETTINGS_STORAGE_KEY, {})))
  const [mediaPrefs, setMediaPrefs] = useState<MediaQueryPrefs>(() => readMediaQueryPrefs())

  const resolvedTheme = resolveTheme(settings.theme, mediaPrefs)

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => sanitizeSettings({ ...prev, ...patch }))
  }, [])

  // Persist on every change (best-effort; see utils/localStorage).
  useEffect(() => {
    writeJSON(SETTINGS_STORAGE_KEY, settings)
  }, [settings])

  // Apply the resolved theme / cell size to the document so CSS custom
  // properties and [data-theme] selectors pick them up.
  useEffect(() => {
    applyResolvedTheme(resolvedTheme)
  }, [resolvedTheme])

  useEffect(() => {
    applyCellSizeScale(settings.cellSizeScale)
  }, [settings.cellSizeScale])

  // While theme is 'system', track OS-level changes live (no reload needed).
  useEffect(() => {
    if (settings.theme !== 'system' || typeof window === 'undefined' || !window.matchMedia) return

    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const contrastQuery = window.matchMedia('(prefers-contrast: more)')
    const update = () => setMediaPrefs(readMediaQueryPrefs())

    darkQuery.addEventListener('change', update)
    contrastQuery.addEventListener('change', update)
    return () => {
      darkQuery.removeEventListener('change', update)
      contrastQuery.removeEventListener('change', update)
    }
  }, [settings.theme])

  return (
    <SettingsContext.Provider value={{ settings, resolvedTheme, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}
