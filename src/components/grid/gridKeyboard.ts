import { toIndex, toRowCol } from '../../engine/board'
import type { Digit } from '../../engine/types'

export const NAV_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'])

interface NavKeyEvent {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
}

/** Pure navigation math: given the current index and a nav key, returns the
 * next index, or null if the key isn't a nav key or the move would leave the
 * grid (no wraparound at edges). */
export function computeNextIndex(index: number, event: NavKeyEvent): number | null {
  const { row, col } = toRowCol(index)
  const jumpToCorner = event.ctrlKey || event.metaKey

  switch (event.key) {
    case 'ArrowUp':
      return row > 0 ? toIndex(row - 1, col) : null
    case 'ArrowDown':
      return row < 8 ? toIndex(row + 1, col) : null
    case 'ArrowLeft':
      return col > 0 ? toIndex(row, col - 1) : null
    case 'ArrowRight':
      return col < 8 ? toIndex(row, col + 1) : null
    case 'Home':
      return jumpToCorner ? toIndex(0, 0) : toIndex(row, 0)
    case 'End':
      return jumpToCorner ? toIndex(8, 8) : toIndex(row, 8)
    default:
      return null
  }
}

const DIGIT_KEYS: Record<string, Digit> = {
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
}

export function parseDigitKey(key: string): Digit | null {
  return DIGIT_KEYS[key] ?? null
}

export function isClearKey(key: string): boolean {
  return key === 'Backspace' || key === 'Delete' || key === '0'
}
