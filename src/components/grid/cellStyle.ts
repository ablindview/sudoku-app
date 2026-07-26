import type { CSSProperties } from 'react'
import type { CellDisplayState } from './cellLabel'

/**
 * Per-cell inline style: the digit's identity color (background/ink), the
 * 3x3 box's outline color (as a real `border`, not `box-shadow`), and — for
 * exactly one of "selected" / "same-digit match" / "in the focused row or
 * column" — a ring or band drawn via `box-shadow`.
 *
 * Box-edge color uses `border` rather than `box-shadow` deliberately: an
 * inset box-shadow is clipped to the padding box (i.e. it starts just
 * *inside* the border), so a bordered edge and an inset box-shadow ring can
 * never paint over each other — they're geometrically non-overlapping by
 * construction, not by stacking order. (An earlier version used box-shadow
 * for both and the border layer visually hid the selection ring on most
 * cells; this sidesteps that class of bug entirely instead of re-ordering
 * around it.)
 *
 * Selected / same-digit / row-col-band all use the same *spread*-based inset
 * technique (0 offset, growing spread) rather than an *offset*-based one (0
 * spread, nonzero offset) — the row/col band originally used the offset
 * form (a thin line pushed in from one edge) and was repeatedly reported as
 * invisible on one user's real iOS Safari even after the ring, built with
 * the spread form, was confirmed visible on the same device/theme. Rather
 * than keep guessing at *why* WebKit fails to paint that particular shadow
 * shape, the band was switched to the same spread technique the ring
 * already proved reliable: every cell in the focused row/column gets a full
 * thin outline-style ring (not just a top/bottom or left/right edge).
 *
 * Selected / same-digit use --color-ring-primary then --color-ring-secondary
 * at a larger offset; the row/column band uses the separate
 * --color-band-primary/-secondary pair (see theme.css — themed per mode
 * rather than a fixed white-then-black, and collapsed to a single solid
 * color in dark mode specifically, since even the correctly-themed two-tone
 * version was reported as hard to see there). The same-digit ring
 * deliberately does NOT use the cell's own --digit-ink color the way an
 * earlier version did — that made the "you're highlighted" ring blend into
 * the digit's own already-visible text color instead of reading as a
 * distinct signal. "Selected", "same-digit highlight", and "in the focused
 * row/column" are mutually exclusive in valid, non-conflicting play
 * (Sudoku's own rules mean a matching digit can never legitimately share a
 * row/column with the selected cell, and a cell can match at most one of
 * "in the selected row" / "in the selected column" since both together
 * would make it the selected cell itself), so these never need to compose.
 */
export function buildCellInlineStyle(
  cell: CellDisplayState,
  row: number,
  col: number,
  selectedRow: number | null,
  selectedCol: number | null,
  nonEdgeBorderColor: string,
): CSSProperties {
  const style: Record<string, string> = {}

  if (cell.value !== 0) {
    // Once a digit has all 9 of its solution cells correctly filled, there's
    // nowhere left to place another one — swap which of the pair is the
    // background and which is the text, so completed digits read as clearly
    // different at a glance. Contrast ratio is symmetric (contrast(A,B) ==
    // contrast(B,A)), so this is guaranteed to stay exactly as readable as
    // the normal look, for every digit, with no separate contrast check needed.
    if (cell.isDigitComplete) {
      style['--digit-bg'] = `var(--identity-${cell.value}-ink)`
      style['--digit-ink'] = `var(--identity-${cell.value})`
    } else {
      style['--digit-bg'] = `var(--identity-${cell.value})`
      style['--digit-ink'] = `var(--identity-${cell.value}-ink)`
    }
  }
  style['--box-color'] = `var(--box-outline-${cell.box + 1})`

  style.borderStyle = 'solid'
  style.borderWidth = '3px'
  style.borderTopColor = row % 3 === 0 ? 'var(--box-color)' : nonEdgeBorderColor
  style.borderBottomColor = row % 3 === 2 ? 'var(--box-color)' : nonEdgeBorderColor
  style.borderLeftColor = col % 3 === 0 ? 'var(--box-color)' : nonEdgeBorderColor
  style.borderRightColor = col % 3 === 2 ? 'var(--box-color)' : nonEdgeBorderColor

  const shadows: string[] = []
  if (cell.isSelected) {
    shadows.push('inset 0 0 0 3px var(--color-ring-primary)', 'inset 0 0 0 6px var(--color-ring-secondary)')
  } else if (cell.isDigitHighlighted) {
    shadows.push('inset 0 0 0 4px var(--color-ring-primary)', 'inset 0 0 0 7px var(--color-ring-secondary)')
  } else {
    const inSelectedRow = selectedRow !== null && row === selectedRow
    const inSelectedCol = selectedCol !== null && col === selectedCol
    if (inSelectedRow || inSelectedCol) {
      shadows.push('inset 0 0 0 3px var(--color-band-primary)', 'inset 0 0 0 5px var(--color-band-secondary)')
    }
  }

  if (shadows.length > 0) {
    style.boxShadow = shadows.join(', ')
  }

  return style as CSSProperties
}
