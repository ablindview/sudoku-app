import type { ResolvedTheme } from './settingsTypes'

// Shared by main.tsx (synchronous pre-paint application, avoiding a flash of
// the wrong theme) and SettingsProvider (applying updates after mount).
export function applyResolvedTheme(theme: ResolvedTheme): void {
  document.documentElement.dataset.theme = theme
}

export function applyCellSizeScale(scale: number): void {
  document.documentElement.style.setProperty('--cell-size-scale', String(scale))
}
