import type { CSSProperties } from 'react'
import type { CellDisplayState } from './cellLabel'

/**
 * Per-cell inline style: the digit's identity color (background/ink), the
 * 3x3 box's outline color, and — for exactly one of "selected" / "same-digit
 * match" / "in the focused row or column" — a ring drawn via `box-shadow`
 * (selected/same-digit) or `outline` (the row/col band).
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
 * The row/column band went through three techniques that each rendered
 * correctly in every environment tested here, yet were all reported as
 * invisible on one user's real iOS Safari: an offset-based box-shadow line,
 * a spread-based box-shadow ring (matching the selection ring's own,
 * confirmed-visible technique), and then a `border` set via a `--band-color`
 * custom property consumed by a `::before` pseudo-element (matching the
 * box-edge border's own, also confirmed-visible technique). The common
 * thread in the two box-shadow attempts was updates that only apply on a
 * *later* re-render; the common thread in the pseudo-element attempt was a
 * custom property set via *inline* style needing to inherit into generated
 * content — both known rough edges in different WebKit versions. `outline`
 * sidesteps both: it's set directly inline on the real cell element (same
 * mechanism as `border` and `box-shadow` already are, no pseudo-element and
 * no custom-property indirection involved), referencing theme tokens
 * defined in an ordinary stylesheet rule rather than inline.
 *
 * The band gives up its two-tone rescue color (see theme.css) in exchange
 * for something that reliably shows up at all — but only for cells with no
 * value: a filled band cell reuses that cell's own --digit-ink instead of
 * the theme default. --digit-ink is chosen to clear 4.5:1 (text-level
 * contrast) against that exact cell's --digit-bg, which trivially clears
 * the 3:1 non-text minimum an outline needs too, for every one of the 9
 * identity colors — a single fixed band color cannot do that (e.g.
 * black-on-identity-7 is only ~2.4:1 in the light theme), which is exactly
 * why the two-tone approach existed in the first place.
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
 *
 * HAZARD for future edits: the band's `outline` is the same CSS property
 * `:focus-visible` uses (see base.css) for the native keyboard focus
 * ring, and an inline `outline` always wins over that stylesheet rule
 * regardless of specificity. This is currently safe only because real DOM
 * focus is pinned to `selectedIndex` (GridA11yGrid's roving tabindex /
 * GridInputTable's `<input>` focus), which is exactly the cell that takes
 * the `isSelected` branch above and therefore can never also reach the
 * band branch. If that exclusion ever changes, a banded cell could
 * silently swallow a keyboard user's focus indicator.
 *
 * Box elevation: every cell sharing the selected cell's 3x3 box gets a
 * `transform: scale()` plus a drop shadow, so the whole box appears to lift
 * as a single unit — a purely supplementary visual cue layered on top of
 * the box's own (already always-visible) outline color, never the sole way
 * to tell which box is active. The grid has no single wrapping element per
 * box (it's a flat 9x9 grid of cells), so each cell's `transform-origin` is
 * set to the box's own far corner/edge/center based on that cell's position
 * *within* the box (row%3, col%3) — every one of the 9 cells then grows
 * away from the box's shared center point instead of its own, which reads
 * as the box expanding outward together rather than 9 cells each puffing up
 * independently. This composes freely with the ring/band styles above: it
 * uses `transform` and an outset `box-shadow` (append-only — never
 * overwrites the inset ring shadows already pushed onto `shadows`, since
 * inset and outset shadows occupy entirely separate, non-overlapping
 * painted regions), neither of which any state above already claims.
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
      style.outlineStyle = 'solid'
      style.outlineWidth = '4px'
      style.outlineOffset = '-4px'
      style.outlineColor = digitInk ?? 'var(--color-band-primary)'
    }
  }

  // Every box-mate deliberately grows into its neighbors along their shared
  // internal edges (that's what makes the box read as one lifted unit), and
  // they all share the same z-index, so DOM order decides which one paints
  // on top along each seam. The *selected* cell is excluded from this even
  // though it's in the box too — otherwise a later-DOM-order box-mate could
  // paint over a sliver of the selected cell's own ring, the one indicator
  // in this whole file that must never be partially covered by something
  // else. The selected cell's ring is already the strongest signal in the
  // grid, so it doesn't need the lift effect on top of it anyway.
  if (focusedBox !== null && cell.box === focusedBox && !cell.isSelected) {
    // The origin sits at each cell's corner NEAREST the box's shared center
    // (the opposite of that cell's own position within the box) — scaling
    // up then pushes every cell's outer edge away from the box center, so
    // all 9 cells expand outward together instead of each ballooning around
    // its own middle.
    const originX = col % 3 === 0 ? '100%' : col % 3 === 1 ? '50%' : '0%'
    const originY = row % 3 === 0 ? '100%' : row % 3 === 1 ? '50%' : '0%'
    style.transform = 'scale(1.06)'
    style.transformOrigin = `${originX} ${originY}`
    style.zIndex = '1'
    shadows.push('0 3px 8px var(--elevation-shadow)')
  }

  if (shadows.length > 0) {
    style.boxShadow = shadows.join(', ')
  }

  return style as CSSProperties
}
