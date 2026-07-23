import type { CSSProperties } from 'react'
import type { CellDisplayState } from './cellLabel'

/**
 * Per-cell inline style: the digit's identity color (background/ink) and a
 * composed box-shadow stack (box-outline edges + selected ring + same-digit
 * highlight ring). Shared by both grid modes so the visual language — and
 * the "multiple layers must coexist, not clobber each other" logic — lives
 * in exactly one place.
 *
 * box-shadow layers are computed here (rather than left to separate CSS
 * classes) because a single `box-shadow` declaration only ever wins as a
 * whole — the last matching CSS rule replaces it entirely, it doesn't merge
 * with an earlier rule's shadows. A cell can simultaneously sit on a 3x3 box
 * edge, be the selected cell, AND match the currently-selected digit, so all
 * three need to land in one combined value.
 */
export function buildCellInlineStyle(cell: CellDisplayState, row: number, col: number): CSSProperties {
  const style: Record<string, string> = {}

  if (cell.value !== 0) {
    style['--digit-bg'] = `var(--identity-${cell.value})`
    style['--digit-ink'] = `var(--identity-${cell.value}-ink)`
  }
  style['--box-color'] = `var(--box-outline-${cell.box + 1})`

  const shadows: string[] = []
  if (row % 3 === 0) shadows.push('inset 0 3px 0 0 var(--box-color)')
  if (row % 3 === 2) shadows.push('inset 0 -3px 0 0 var(--box-color)')
  if (col % 3 === 0) shadows.push('inset 3px 0 0 0 var(--box-color)')
  if (col % 3 === 2) shadows.push('inset -3px 0 0 0 var(--box-color)')
  if (cell.isSelected) shadows.push('inset 0 0 0 3px var(--color-focus-ring)')
  if (cell.isDigitHighlighted) shadows.push('inset 0 0 0 3px var(--digit-ink, var(--color-text))')

  if (shadows.length > 0) {
    style.boxShadow = shadows.join(', ')
  }

  return style as CSSProperties
}
