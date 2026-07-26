import type { CSSProperties } from 'react'
import type { CellDisplayState } from './cellLabel'

/**
 * Per-cell inline style: the digit's identity color (background/ink), the
 * 3x3 box's outline color, and — for exactly one of "selected" / "same-digit
 * match" / "in the focused row or column" — a ring drawn via `box-shadow`
 * (selected/same-digit) or a `border`-based `::before` overlay (the row/col
 * band; see the `--band-color` custom property and its consumer in grid.css).
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
 * The row/column band went through two box-shadow techniques (an
 * offset-based line, then a spread-based ring matching the selection ring's
 * own technique) that were each confirmed working in every environment
 * tested here, yet both were reported as invisible on one user's real iOS
 * Safari — including on cells whose box-shadow value only appears after a
 * *later* re-render (selecting a different cell), as opposed to the
 * initially-selected cell's ring, which that user *does* see. That points at
 * a repaint failure specific to box-shadow updates on that device/browser,
 * not a color/contrast problem. Rather than keep iterating on box-shadow
 * variants, the band now sets a `--band-color` custom property that a plain
 * CSS `border` (via `::before` in grid.css) consumes — the exact mechanism
 * already proven to repaint correctly on that device for the per-box
 * outline colors. This does give up the band's two-tone rescue color (see
 * theme.css) in exchange for something that reliably shows up at all — but
 * only for cells with no value: a filled band cell reuses that cell's own
 * --digit-ink instead of the theme default. --digit-ink is chosen to clear
 * 4.5:1 (text-level contrast) against that exact cell's --digit-bg, which
 * trivially clears the 3:1 non-text minimum a border needs too, for every
 * one of the 9 identity colors — a single fixed band color cannot do that
 * (e.g. black-on-identity-7 is only ~2.4:1 in the light theme), which is
 * exactly why the two-tone approach existed in the first place.
 *
 * Selected / same-digit use --color-ring-primary then --color-ring-secondary
 * at a larger offset. The same-digit ring deliberately does NOT use the
 * cell's own --digit-ink color the way an earlier version did — that made
 * the "you're highlighted" ring blend into the digit's own already-visible
 * text color instead of reading as a distinct signal. "Selected",
 * "same-digit highlight", and "in the focused row/column" are mutually
 * exclusive in valid, non-conflicting play (Sudoku's own rules mean a
 * matching digit can never legitimately share a row/column with the
 * selected cell, and a cell can match at most one of "in the selected row" /
 * "in the selected column" since both together would make it the selected
 * cell itself), so these never need to compose.
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
  let digitInk: string | null = null

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
      digitInk = style['--digit-ink']
    } else {
      style['--digit-bg'] = `var(--identity-${cell.value})`
      style['--digit-ink'] = `var(--identity-${cell.value}-ink)`
      digitInk = style['--digit-ink']
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
      style['--band-color'] = digitInk ?? 'var(--color-band-primary)'
    }
  }

  if (shadows.length > 0) {
    style.boxShadow = shadows.join(', ')
  }

  return style as CSSProperties
}
