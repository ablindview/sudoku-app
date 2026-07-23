export type ThemeChoice = 'system' | 'light' | 'dark' | 'contrast-light' | 'contrast-dark'
export type ResolvedTheme = 'light' | 'dark' | 'contrast-light' | 'contrast-dark'
export type GridMode = 'a11yGrid' | 'inputTable'

export interface Settings {
  gridMode: GridMode
  theme: ThemeChoice
  cellSizeScale: number
  autoCheckConflicts: boolean
  liveConflictAnnouncements: boolean
}

export const THEME_CHOICES: readonly ThemeChoice[] = ['system', 'light', 'dark', 'contrast-light', 'contrast-dark']
export const GRID_MODES: readonly GridMode[] = ['a11yGrid', 'inputTable']

export const CELL_SIZE_SCALE_MIN = 0.8
export const CELL_SIZE_SCALE_MAX = 1.8
export const CELL_SIZE_SCALE_STEP = 0.1

export const DEFAULT_SETTINGS: Settings = {
  gridMode: 'a11yGrid',
  theme: 'system',
  cellSizeScale: 1,
  autoCheckConflicts: true,
  liveConflictAnnouncements: true,
}

export const SETTINGS_STORAGE_KEY = 'sudoku-settings-v1'

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

/**
 * Merges a possibly-partial, possibly-corrupt value (e.g. hand-edited or
 * stale localStorage JSON) over the defaults, validating each field rather
 * than trusting the shape blindly.
 */
export function sanitizeSettings(input: unknown): Settings {
  const raw = (input && typeof input === 'object' ? input : {}) as Partial<Settings>

  return {
    gridMode: GRID_MODES.includes(raw.gridMode as GridMode) ? (raw.gridMode as GridMode) : DEFAULT_SETTINGS.gridMode,
    theme: THEME_CHOICES.includes(raw.theme as ThemeChoice) ? (raw.theme as ThemeChoice) : DEFAULT_SETTINGS.theme,
    cellSizeScale:
      typeof raw.cellSizeScale === 'number' && Number.isFinite(raw.cellSizeScale)
        ? clamp(raw.cellSizeScale, CELL_SIZE_SCALE_MIN, CELL_SIZE_SCALE_MAX)
        : DEFAULT_SETTINGS.cellSizeScale,
    autoCheckConflicts:
      typeof raw.autoCheckConflicts === 'boolean' ? raw.autoCheckConflicts : DEFAULT_SETTINGS.autoCheckConflicts,
    liveConflictAnnouncements:
      typeof raw.liveConflictAnnouncements === 'boolean'
        ? raw.liveConflictAnnouncements
        : DEFAULT_SETTINGS.liveConflictAnnouncements,
  }
}
