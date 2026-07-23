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
 * Selected / same-digit / row-col-band are all drawn as a
 * --color-ring-primary line then a --color-ring-secondary line at a larger
 * offset (see theme.css for why the primary/secondary pairing is themed
 * rather than a fixed white-then-black: a fixed order left the visible
 * portion nearly invisible against an empty cell in dark mode, since black
 * on the dark surface color is only ~1.35:1). The same-digit ring
 * deliberately does NOT use the cell's own --digit-ink color the way an
 * earlier version did — that made the "you're highlighted" ring blend into
 * the digit's own already-visible text color instead of reading as a
 * distinct signal. "Selected", "same-digit highlight", and "in the focused
 * row/column" are mutually exclusive in valid, non-conflicting play
 * (Sudoku's own rules mean a matching digit can never legitimately share a
 * row/column with the selected cell), so these never need to compose with
 * each other.
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
    if (inSelectedRow) {
      shadows.push('inset 0 4px 0 0 var(--color-ring-primary)', 'inset 0 7px 0 0 var(--color-ring-secondary)')
      shadows.push('inset 0 -4px 0 0 var(--color-ring-primary)', 'inset 0 -7px 0 0 var(--color-ring-secondary)')
    }
    if (inSelectedCol) {
      shadows.push('inset 4px 0 0 0 var(--color-ring-primary)', 'inset 7px 0 0 0 var(--color-ring-secondary)')
      shadows.push('inset -4px 0 0 0 var(--color-ring-primary)', 'inset -7px 0 0 0 var(--color-ring-secondary)')
    }
  }

  if (shadows.length > 0) {
    style.boxShadow = shadows.join(', ')
  }

  return style as CSSProperties
}
