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
 * Selected / row-col-band rings are drawn as a white line then a black line
 * at a slightly larger offset: whichever theme's identity color sits under
 * it, at least one of white or black clears 3:1 contrast against all 9 (
 * verified numerically — no single hue does, but the pair always covers it).
 * "Selected", "same-digit highlight", and "in the focused row/column" are
 * mutually exclusive in valid, non-conflicting play (Sudoku's own rules mean
 * a matching digit can never legitimately share a row/column with the
 * selected cell), so these never need to compose with each other.
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
    style['--digit-bg'] = `var(--identity-${cell.value})`
    style['--digit-ink'] = `var(--identity-${cell.value}-ink)`
  }
  style['--box-color'] = `var(--box-outline-${cell.box + 1})`

  style.borderStyle = 'solid'
  style.borderWidth = '2px'
  style.borderTopColor = row % 3 === 0 ? 'var(--box-color)' : nonEdgeBorderColor
  style.borderBottomColor = row % 3 === 2 ? 'var(--box-color)' : nonEdgeBorderColor
  style.borderLeftColor = col % 3 === 0 ? 'var(--box-color)' : nonEdgeBorderColor
  style.borderRightColor = col % 3 === 2 ? 'var(--box-color)' : nonEdgeBorderColor

  const shadows: string[] = []
  if (cell.isSelected) {
    shadows.push('inset 0 0 0 2px #ffffff', 'inset 0 0 0 4px #000000')
  } else if (cell.isDigitHighlighted) {
    shadows.push('inset 0 0 0 3px var(--digit-ink, var(--color-text))')
  } else {
    const inSelectedRow = selectedRow !== null && row === selectedRow
    const inSelectedCol = selectedCol !== null && col === selectedCol
    if (inSelectedRow) {
      shadows.push('inset 0 3px 0 0 #ffffff', 'inset 0 4px 0 0 #000000')
      shadows.push('inset 0 -3px 0 0 #ffffff', 'inset 0 -4px 0 0 #000000')
    }
    if (inSelectedCol) {
      shadows.push('inset 3px 0 0 0 #ffffff', 'inset 4px 0 0 0 #000000')
      shadows.push('inset -3px 0 0 0 #ffffff', 'inset -4px 0 0 0 #000000')
    }
  }

  if (shadows.length > 0) {
    style.boxShadow = shadows.join(', ')
  }

  return style as CSSProperties
}
