import type { CSSProperties } from 'react'
import type { CellDisplayState } from './cellLabel'

/**
 * Per-cell inline style: the digit's identity color (background/ink), the
 * 3x3 box's outline color (overridden to a bright red for whichever box is
 * currently focused), and — for exactly one of "selected" / "same-digit
 * match" / "in the focused row or column" — a ring drawn via `box-shadow`
 * (selected) or `outline` (same-digit highlight, row/col band).
 *
 * Box-edge color uses `border` rather than `box-shadow` deliberately: an
 * inset box-shadow is clipped to the padding box (i.e. it starts just
 * *inside* the border), so a bordered edge and an inset box-shadow ring can
 * never paint over each other — they're geometrically non-overlapping by
 * construction, not by stacking order. (An earlier version used box-shadow
 * for both and the border layer visually hid the selection ring on most
 * cells; this sidesteps that class of bug entirely instead of re-ordering
 * around it.) The focused-box highlight reuses this same border mechanism
 * rather than the `transform`/`box-shadow` "lift" effect an earlier version
 * used — that version was reported as invisible on one user's real device,
 * while border-drawn box-edge colors have been visibly reliable there
 * throughout this whole file's history, so the focused box now just
 * overrides its own true edge sides to `--color-focused-box`, thickened to
 * 5px (from the normal 3px) so there's a non-color signal too — in the two
 * contrast themes `--color-focused-box` deliberately equals the theme's one
 * fixed box-outline color, so thickness is the *only* thing that marks the
 * focused box there.
 *
 * The row/column band and the same-digit highlight both use `outline`
 * (rather than `box-shadow`, which repeatedly failed to repaint reliably on
 * one user's real iOS Safari for cells other than the one selected at
 * initial page load, across several techniques tried here): it's set
 * directly inline on the real cell element (same mechanism `border` and the
 * selected-cell `box-shadow` already use, no pseudo-element and no
 * custom-property-into-generated-content indirection involved).
 *
 * Both the band and the same-digit highlight are single flat colors — a
 * uniform look was requested over the earlier per-cell-contrast-guaranteed
 * approach (reusing each cell's own --digit-ink), which produced a visibly
 * inconsistent outline color from one band cell to the next depending on
 * what digit happened to be in it. NOTE: since a single fixed color cannot
 * clear 3:1 contrast against all 9 identity fill colors (the same reason
 * the selected-cell ring uses a two-tone pair), both `--color-highlight`
 * and `--color-focused-box` will read poorly against some digits' own fill
 * — this was an explicit, informed trade-off (uniformity over guaranteed
 * per-cell contrast), not an oversight.
 *
 * "Selected", "same-digit highlight", and "in the focused row/column" are
 * mutually exclusive in valid, non-conflicting play (Sudoku's own rules
 * mean a matching digit can never legitimately share a row/column with the
 * selected cell, and a cell can match at most one of "in the selected row" /
 * "in the selected column" since both together would make it the selected
 * cell itself), so these never need to compose.
 *
 * HAZARD for future edits: `outline` is the same CSS property `:focus-visible`
 * uses (see base.css) for the native keyboard focus ring, and an inline
 * `outline` always wins over that stylesheet rule regardless of specificity.
 * This is currently safe only because real DOM focus is pinned to
 * `selectedIndex` (GridA11yGrid's roving tabindex / GridInputTable's
 * `<input>` focus), which is exactly the cell that takes the `isSelected`
 * branch above and therefore can never also reach the highlight/band
 * branches. If that exclusion ever changes, a highlighted or banded cell
 * could silently swallow a keyboard user's focus indicator.
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

  // The focused box's true edge sides get a bright red override instead of
  // its own identity-hued outline color, so the box currently in play reads
  // as distinct from every other box at a glance. Non-edge sides are
  // unaffected either way. The edge is also thickened (5px vs the normal
  // 3px) — in the two contrast themes, --color-focused-box deliberately
  // equals the theme's one fixed box-outline color (no hue is introduced
  // there, matching the rest of that theme's colorless design), so color
  // alone would render every box's edge identical and the focused box would
  // carry no signal at all. Thickness is a second, non-color channel that
  // still differentiates it there, and reinforces the color difference
  // everywhere else too (never rely on a single channel — same principle
  // as the conflict marker's dashed border, see grid.css).
  const isFocusedBox = focusedBox !== null && cell.box === focusedBox
  style['--box-color'] = isFocusedBox ? 'var(--color-focused-box)' : `var(--box-outline-${cell.box + 1})`
  const edgeWidth = isFocusedBox ? '5px' : '3px'

  style.borderStyle = 'solid'
  style.borderTopWidth = row % 3 === 0 ? edgeWidth : '3px'
  style.borderBottomWidth = row % 3 === 2 ? edgeWidth : '3px'
  style.borderLeftWidth = col % 3 === 0 ? edgeWidth : '3px'
  style.borderRightWidth = col % 3 === 2 ? edgeWidth : '3px'
  style.borderTopColor = row % 3 === 0 ? 'var(--box-color)' : nonEdgeBorderColor
  style.borderBottomColor = row % 3 === 2 ? 'var(--box-color)' : nonEdgeBorderColor
  style.borderLeftColor = col % 3 === 0 ? 'var(--box-color)' : nonEdgeBorderColor
  style.borderRightColor = col % 3 === 2 ? 'var(--box-color)' : nonEdgeBorderColor

  if (cell.isSelected) {
    style.boxShadow = 'inset 0 0 0 3px var(--color-ring-primary), inset 0 0 0 6px var(--color-ring-secondary)'
  } else if (cell.isDigitHighlighted) {
    style.outlineStyle = 'solid'
    style.outlineWidth = '4px'
    style.outlineOffset = '-4px'
    style.outlineColor = 'var(--color-highlight)'
  } else {
    const inSelectedRow = selectedRow !== null && row === selectedRow
    const inSelectedCol = selectedCol !== null && col === selectedCol
    if (inSelectedRow || inSelectedCol) {
      style.outlineStyle = 'solid'
      style.outlineWidth = '4px'
      style.outlineOffset = '-4px'
      style.outlineColor = 'var(--color-band-primary)'
    }
  }

  return style as CSSProperties
}
