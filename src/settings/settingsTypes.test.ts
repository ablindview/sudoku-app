import { describe, expect, it } from 'vitest'
import { CELL_SIZE_SCALE_MAX, CELL_SIZE_SCALE_MIN, DEFAULT_SETTINGS, sanitizeSettings } from './settingsTypes'

describe('sanitizeSettings', () => {
  it('returns defaults for null/undefined/non-object input', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(sanitizeSettings('garbage')).toEqual(DEFAULT_SETTINGS)
  })

  it('passes through a fully valid settings object', () => {
    const valid = {
      gridMode: 'inputTable',
      theme: 'contrast-dark',
      cellSizeScale: 1.4,
      autoCheckConflicts: false,
      liveConflictAnnouncements: false,
    }
    expect(sanitizeSettings(valid)).toEqual(valid)
  })

  it('falls back to defaults for invalid enum-like fields', () => {
    const result = sanitizeSettings({ gridMode: 'nonsense', theme: 'nonsense' })
    expect(result.gridMode).toBe(DEFAULT_SETTINGS.gridMode)
    expect(result.theme).toBe(DEFAULT_SETTINGS.theme)
  })

  it('clamps cellSizeScale into the valid range', () => {
    expect(sanitizeSettings({ cellSizeScale: 0.1 }).cellSizeScale).toBe(CELL_SIZE_SCALE_MIN)
    expect(sanitizeSettings({ cellSizeScale: 10 }).cellSizeScale).toBe(CELL_SIZE_SCALE_MAX)
    expect(sanitizeSettings({ cellSizeScale: Number.NaN }).cellSizeScale).toBe(DEFAULT_SETTINGS.cellSizeScale)
  })

  it('falls back to defaults for non-boolean flags', () => {
    const result = sanitizeSettings({ autoCheckConflicts: 'yes', liveConflictAnnouncements: 1 })
    expect(result.autoCheckConflicts).toBe(DEFAULT_SETTINGS.autoCheckConflicts)
    expect(result.liveConflictAnnouncements).toBe(DEFAULT_SETTINGS.liveConflictAnnouncements)
  })
})
