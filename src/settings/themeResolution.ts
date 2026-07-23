import type { ResolvedTheme, ThemeChoice } from './settingsTypes'

export interface MediaQueryPrefs {
  prefersDark: boolean
  prefersMoreContrast: boolean
}

/** Resolves an explicit choice directly; `'system'` falls back to OS media-query prefs. */
export function resolveTheme(theme: ThemeChoice, prefs: MediaQueryPrefs): ResolvedTheme {
  if (theme !== 'system') return theme
  if (prefs.prefersMoreContrast) return prefs.prefersDark ? 'contrast-dark' : 'contrast-light'
  return prefs.prefersDark ? 'dark' : 'light'
}

export function readMediaQueryPrefs(): MediaQueryPrefs {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return { prefersDark: false, prefersMoreContrast: false }
  }
  return {
    prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    prefersMoreContrast: window.matchMedia('(prefers-contrast: more)').matches,
  }
}
