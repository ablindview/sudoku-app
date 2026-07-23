import { describe, expect, it } from 'vitest'
import { computeNextIndex, isClearKey, parseDigitKey } from './gridKeyboard'
import { toIndex } from '../../engine/board'

describe('computeNextIndex', () => {
  it('moves up/down/left/right within bounds', () => {
    const center = toIndex(4, 4)
    expect(computeNextIndex(center, { key: 'ArrowUp' })).toBe(toIndex(3, 4))
    expect(computeNextIndex(center, { key: 'ArrowDown' })).toBe(toIndex(5, 4))
    expect(computeNextIndex(center, { key: 'ArrowLeft' })).toBe(toIndex(4, 3))
    expect(computeNextIndex(center, { key: 'ArrowRight' })).toBe(toIndex(4, 5))
  })

  it('does not wrap around at edges', () => {
    expect(computeNextIndex(toIndex(0, 0), { key: 'ArrowUp' })).toBeNull()
    expect(computeNextIndex(toIndex(0, 0), { key: 'ArrowLeft' })).toBeNull()
    expect(computeNextIndex(toIndex(8, 8), { key: 'ArrowDown' })).toBeNull()
    expect(computeNextIndex(toIndex(8, 8), { key: 'ArrowRight' })).toBeNull()
  })

  it('Home/End move to row start/end', () => {
    const mid = toIndex(3, 5)
    expect(computeNextIndex(mid, { key: 'Home' })).toBe(toIndex(3, 0))
    expect(computeNextIndex(mid, { key: 'End' })).toBe(toIndex(3, 8))
  })

  it('Ctrl+Home/Ctrl+End move to grid corners', () => {
    const mid = toIndex(3, 5)
    expect(computeNextIndex(mid, { key: 'Home', ctrlKey: true })).toBe(toIndex(0, 0))
    expect(computeNextIndex(mid, { key: 'End', ctrlKey: true })).toBe(toIndex(8, 8))
  })

  it('returns null for non-navigation keys', () => {
    expect(computeNextIndex(toIndex(4, 4), { key: 'a' })).toBeNull()
  })
})

describe('parseDigitKey', () => {
  it('parses 1-9', () => {
    for (let d = 1; d <= 9; d++) {
      expect(parseDigitKey(String(d))).toBe(d)
    }
  })

  it('returns null for non-digit keys', () => {
    expect(parseDigitKey('0')).toBeNull()
    expect(parseDigitKey('a')).toBeNull()
  })
})

describe('isClearKey', () => {
  it('recognizes Backspace, Delete, and 0', () => {
    expect(isClearKey('Backspace')).toBe(true)
    expect(isClearKey('Delete')).toBe(true)
    expect(isClearKey('0')).toBe(true)
  })

  it('rejects other keys', () => {
    expect(isClearKey('1')).toBe(false)
    expect(isClearKey('a')).toBe(false)
  })
})
