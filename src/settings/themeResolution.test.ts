import { describe, expect, it } from 'vitest'
import { resolveTheme } from './themeResolution'

describe('resolveTheme', () => {
  it('returns an explicit choice unchanged, ignoring media prefs', () => {
    expect(resolveTheme('dark', { prefersDark: false, prefersMoreContrast: false })).toBe('dark')
    expect(resolveTheme('contrast-light', { prefersDark: true, prefersMoreContrast: true })).toBe('contrast-light')
  })

  it('resolves system + light + no contrast preference to light', () => {
    expect(resolveTheme('system', { prefersDark: false, prefersMoreContrast: false })).toBe('light')
  })

  it('resolves system + dark preference to dark', () => {
    expect(resolveTheme('system', { prefersDark: true, prefersMoreContrast: false })).toBe('dark')
  })

  it('resolves system + more-contrast + light to contrast-light', () => {
    expect(resolveTheme('system', { prefersDark: false, prefersMoreContrast: true })).toBe('contrast-light')
  })

  it('resolves system + more-contrast + dark to contrast-dark', () => {
    expect(resolveTheme('system', { prefersDark: true, prefersMoreContrast: true })).toBe('contrast-dark')
  })
})
