import type { CSSProperties } from 'react'
import type { CellDisplayState } from './cellLabel'

/**
 * Per-cell inline style: the digit's identity color (background/ink), the
 * 3x3 box's outline color (overridden to a bright red for whichever box is
 * currently focused), the row/column band, and — only for the selected cell
 * — a ring drawn via `box-shadow`. "Same-digit match" is not a ring at all:
 * see below.
 *
 * Box-edge color and the row/column band are BOTH drawn via per-side
 * `border`, not `box-shadow`/`outline` — the one mechanism that's stayed
 * reliably visible on one user's real device across everything else tried
 * here (box-shadow repeatedly failed to repaint for cells other than the
 * one selected at initial load; a `::before` pseudo-element and an
 * `outline` both eventually worked for individual features, but border is
 * the original, always-solid baseline). Since a cell's border already has
 * independent top/right/bottom/left colors, the box edge and the band can
 * both be expressed on the SAME cell without competing: true box-boundary
 * sides (row%3==0/2, col%3==0/2) always take `--box-color` (red if this is
 * the focused box, else the box's own identity hue); every other side
 * takes the band color (`--color-band-primary`) if the cell is banded, or
 * the caller-supplied non-edge color otherwise. A focused-box perimeter
 * cell that's also banded therefore shows red on its box-boundary side(s)
 * and white on the rest — requested explicitly, after an earlier version
 * suppressed the band entirely on those cells and lost the row/column
 * signal there.
 *
 * An inset box-shadow is clipped to the padding box (i.e. it starts just
 * *inside* the border), so the border above and the selected-cell ring
 * below can never paint over each other — geometrically non-overlapping by
 * construction, not by stacking order. (An earlier version used box-shadow
 * for both and the border layer visually hid the selection ring on most
 * cells; this sidesteps that class of bug entirely instead of re-ordering
 * around it.)
 *
 * The focused box's true edge sides are thickened (5px vs the normal 3px)
 * so there's a non-color signal too — in the two contrast themes,
 * `--color-focused-box` deliberately equals the theme's one fixed
 * box-outline color, so thickness is the *only* thing that marks the
 * focused box there. Banded non-edge sides are similarly thickened (4px)
 * to match the visual weight the band had as a 4px outline previously.
 * NOTE: since a single fixed color cannot clear 3:1 contrast against all 9
 * identity fill colors (the same reason the selected-cell ring uses a
 * two-tone pair), both `--color-band-primary` and `--color-focused-box`
 * will read poorly against some digits' own fill — an explicit, informed
 * trade-off (uniformity over guaranteed per-cell contrast), not an
 * oversight.
 *
 * Same-digit highlight is NOT a ring/outline/border at all: a matching
 * cell drops its identity color entirely and shows a flat
 * `--color-highlight-bg`/`-text` pair instead (inverted to
 * white-bg/black-text in contrast-dark, whose ordinary filled cells are
 * already black-bg/white-text and would otherwise be indistinguishable
 * from a "highlighted" one). This is text-level contrast (aiming for 21:1,
 * not just the 3:1 a border needs), so it's strictly more readable than
 * the ring it replaced, on top of being simpler.
 *
 * "Selected" and "in the focused row/column" are mutually exclusive in
 * valid, non-conflicting play — and so is "same-digit match" with either of
 * those, or with "in the focused box" (Sudoku's own rules mean a matching
 * digit can never legitimately share a row, column, *or box* with the
 * selected cell) — so none of these need to compose with each other.
 */
export function buildCellInlineStyle(
  cell: CellDisplayState,
  row: number,
  col: number,
  selectedRow: number | null,
  selectedCol: number | null,
  nonEdgeBorderColor: string,
  focusedBox: number | null,
): CSSProperties {
  const style: Record<string, string> = {}

  if (cell.value !== 0) {
    if (cell.isDigitHighlighted) {
      // Drop the identity color entirely instead of ringing it — see the
      // module doc for why.
      style['--digit-bg'] = 'var(--color-highlight-bg)'
      style['--digit-ink'] = 'var(--color-highlight-text)'
    } else if (cell.isDigitComplete) {
      // Once a digit has all 9 of its solution cells correctly filled,
      // there's nowhere left to place another one — swap which of the pair
      // is the background and which is the text, so completed digits read
      // as clearly different at a glance. Contrast ratio is symmetric
      // (contrast(A,B) == contrast(B,A)), so this is guaranteed to stay
      // exactly as readable as the normal look, for every digit, with no
      // separate contrast check needed. Deliberately uses each digit's own
      // --identity-N-ink here, NOT --color-digit-text below — this
      // indicator's look is unaffected by that dark-theme-only override.
      style['--digit-bg'] = `var(--identity-${cell.value}-ink)`
      style['--digit-ink'] = `var(--identity-${cell.value})`
    } else {
      style['--digit-bg'] = `var(--identity-${cell.value})`
      // --color-digit-text is only defined in the dark theme (a flat white,
      // requested over the per-digit ink used everywhere else); it falls
      // back to the normal per-digit ink in every other theme.
      style['--digit-ink'] = `var(--color-digit-text, var(--identity-${cell.value}-ink))`
    }
  }

  // The focused box's true edge sides get a bright red override instead of
  // its own identity-hued outline color, so the box currently in play reads
  // as distinct from every other box at a glance. The edge is also
  // thickened (5px vs the normal 3px) — in the two contrast themes,
  // --color-focused-box deliberately equals the theme's one fixed
  // box-outline color (no hue is introduced there, matching the rest of
  // that theme's colorless design), so color alone would render every
  // box's edge identical and the focused box would carry no signal at all.
  // Thickness is a second, non-color channel that still differentiates it
  // there, and reinforces the color difference everywhere else too (never
  // rely on a single channel — same principle as the conflict marker's
  // dashed border, see grid.css).
  const isFocusedBox = focusedBox !== null && cell.box === focusedBox
  style['--box-color'] = isFocusedBox ? 'var(--color-focused-box)' : `var(--box-outline-${cell.box + 1})`
  const edgeWidth = isFocusedBox ? '5px' : '3px'

  // A cell is "banded" when it shares the selected cell's row or column but
  // isn't the selected cell itself (which gets its own ring below instead).
  const isBanded = !cell.isSelected && ((selectedRow !== null && row === selectedRow) || (selectedCol !== null && col === selectedCol))
  const nonEdgeWidth = isBanded ? '4px' : '3px'
  const nonEdgeColor = isBanded ? 'var(--color-band-primary)' : nonEdgeBorderColor

  style.borderStyle = 'solid'
  style.borderTopWidth = row % 3 === 0 ? edgeWidth : nonEdgeWidth
  style.borderBottomWidth = row % 3 === 2 ? edgeWidth : nonEdgeWidth
  style.borderLeftWidth = col % 3 === 0 ? edgeWidth : nonEdgeWidth
  style.borderRightWidth = col % 3 === 2 ? edgeWidth : nonEdgeWidth
  style.borderTopColor = row % 3 === 0 ? 'var(--box-color)' : nonEdgeColor
  style.borderBottomColor = row % 3 === 2 ? 'var(--box-color)' : nonEdgeColor
  style.borderLeftColor = col % 3 === 0 ? 'var(--box-color)' : nonEdgeColor
  style.borderRightColor = col % 3 === 2 ? 'var(--box-color)' : nonEdgeColor

  if (cell.isSelected) {
    style.boxShadow = 'inset 0 0 0 3px var(--color-ring-primary), inset 0 0 0 6px var(--color-ring-secondary)'
  }

  return style as CSSProperties
}
