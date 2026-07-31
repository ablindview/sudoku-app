import type { CSSProperties } from 'react'
import type { CellDisplayState } from './cellLabel'

/**
 * Per-cell inline style: the digit's identity color (background/ink), the
 * 3x3 box's edge (a plain, uniformly-neutral border using the theme's own
 * dedicated box-boundary token, `--color-box-border` — no per-box hue
 * anymore, wide enough to read as visible separation between boxes — see
 * `--color-focused-box` below for the one box that's an exception), the
 * row/column band, and — only for the selected cell — a ring drawn via
 * `box-shadow`. "Same-digit match" is not a ring at all: see below.
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
 * sides (row%3==0/2, col%3==0/2) always take `--box-color`; every other
 * side takes the band color if the cell is banded, or the caller-supplied
 * non-edge color otherwise.
 *
 * The band itself only colors the sides relevant to its *own* direction —
 * top+bottom for a cell in the focused row, left+right for a cell in the
 * focused column — not all four sides. Since every cell along that row (or
 * column) gets the identical color on the identical pair of sides, their
 * borders line up edge-to-edge into what reads as one continuous line
 * spanning the row/column, rather than each cell getting its own individual
 * outlined box (a look that was explicitly requested against — the earlier
 * all-four-sides version read as "9 separate boxes", not "an outline around
 * the row"). A cell can be in the focused row and column at once only if
 * it's the selected cell itself (excluded — it gets its own ring instead),
 * so a non-selected cell is never in both, and this composes cleanly with
 * the box edge above: a focused-box perimeter cell that's also banded shows
 * red on its box-boundary side(s) and the band's line continuing across the
 * rest — requested explicitly, after an earlier version suppressed the band
 * entirely on those cells and broke the line there.
 *
 * An inset box-shadow is clipped to the padding box (i.e. it starts just
 * *inside* the border), so the border above and the selected-cell ring
 * below can never paint over each other — geometrically non-overlapping by
 * construction, not by stacking order. (An earlier version used box-shadow
 * for both and the border layer visually hid the selection ring on most
 * cells; this sidesteps that class of bug entirely instead of re-ordering
 * around it.)
 *
 * On a box-boundary side, the border above is always --box-color — the band
 * never gets a look-in there at all, since a `border-*-color` can only be
 * one color at a time. That's correct on non-edge sides (a plain border,
 * nothing to compete with) but on the specific side that's BOTH a box edge
 * AND part of the selected row/column, it meant the band's white line
 * simply vanished for that entire stretch — reported explicitly ("the
 * outline does not show on the border side of a box"). Fixed with a second,
 * independent layer: a directional inset box-shadow (offset-only, no blur —
 * `inset 4px 0 0 0 color` paints a solid strip flush against one inner edge,
 * the standard "one-sided inset border" trick) drawn in --color-band-primary
 * on exactly that edge, clipped to the padding box so it can never bleed
 * into the border's own colored strip — it reads as the band continuing
 * just inside the box edge, rather than replacing that edge's color.
 *
 * Box-edge width went through several rounds of adjustment (8px/10px, then
 * 12px/14px, then a thin 2px/4px, then back up to 10px/12px) before landing
 * on 5px/7px. Banded sides stay at 4px, matching the visual weight the band
 * had as an outline previously.
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
 * A completed digit (all 9 solution cells for that value correctly filled)
 * similarly drops its identity color rather than swapping it: no
 * `--digit-bg` is set at all, falling back to the same plain
 * `--color-surface` an empty cell uses, and `--digit-ink` becomes
 * `--color-complete-text` — a theme-specific red chosen to clear 4.5:1
 * text contrast against that surface (an earlier bg/ink *swap* design
 * guaranteed contrast automatically via symmetry, but still used each
 * digit's own identity color; removing color entirely was requested
 * instead). The two contrast themes fall back to their own `--color-text`
 * here (introducing red would break their colorless design the same way it
 * would for the focused box or highlight), so a completed digit is
 * distinguished there by `text-decoration: underline` instead (see
 * `.sudoku-cell--complete` in grid.css) — another non-color channel, same
 * principle as the focused box's extra thickness above.
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
      // there's nowhere left to place another one — drop the identity color
      // entirely (no --digit-bg set, so it falls back to the plain
      // --color-surface every empty cell already uses) and show the digit
      // in --color-complete-text instead. See the module doc for the
      // contrast reasoning and the contrast-theme fallback.
      style['--digit-ink'] = 'var(--color-complete-text)'
    } else {
      style['--digit-bg'] = `var(--identity-${cell.value})`
      // --color-digit-text is only defined in the dark theme (a flat white,
      // requested over the per-digit ink used everywhere else); it falls
      // back to the normal per-digit ink in every other theme.
      style['--digit-ink'] = `var(--color-digit-text, var(--identity-${cell.value}-ink))`
    }
  }

  // Non-focused boxes checkerboard between --color-box-border (purple) and
  // --color-box-border-alt (white in dark theme; a near-black instead of
  // literal white in light theme, since white-on-white would be invisible
  // there — same "flip the two-tone pair per theme" approach already used
  // for --color-ring-primary/-secondary and --color-band-primary) by box
  // parity: (boxRow + boxCol) % 2 — box 0 (top-left) is purple, box 1
  // (top-middle) is the alt color, box 2 (top-right) is purple, and so on,
  // explicitly requested as a 9-box checkerboard rather than one uniform
  // border color. The two contrast themes define --color-box-border-alt as
  // the SAME value as --color-box-border (both just their one neutral), so
  // the checkerboard collapses to a no-op there — introducing purple would
  // break their colorless design, and they already have no second neutral
  // to alternate with without inventing one. The focused box overrides to
  // bright red regardless of parity — except in the two contrast themes,
  // where --color-focused-box necessarily equals --color-box-border
  // (neither can introduce a distinguishing hue without breaking their
  // whole colorless design), so color alone carries no signal there. The
  // edge is thickened when focused (7px vs the normal 5px) as a second,
  // non-color channel that covers exactly that case, and simply reinforces
  // the color difference everywhere else — never rely on a single channel,
  // same principle as the conflict marker's dashed border (see grid.css).
  const isFocusedBox = focusedBox !== null && cell.box === focusedBox
  const boxRow = Math.floor(cell.box / 3)
  const boxCol = cell.box % 3
  const isEvenParityBox = (boxRow + boxCol) % 2 === 0
  style['--box-color'] = isFocusedBox
    ? 'var(--color-focused-box)'
    : isEvenParityBox
      ? 'var(--color-box-border)'
      : 'var(--color-box-border-alt)'
  const EDGE_WIDTH = isFocusedBox ? '7px' : '5px'
  const BAND_WIDTH = '4px'

  // The row band colors only top+bottom (never left/right); the column band
  // colors only left+right — see the module doc for why this reads as one
  // continuous line instead of a box around each cell. Neither ever applies
  // to the selected cell, which gets its own ring below instead.
  const inSelectedRow = !cell.isSelected && selectedRow !== null && row === selectedRow
  const inSelectedCol = !cell.isSelected && selectedCol !== null && col === selectedCol

  const topIsEdge = row % 3 === 0
  const bottomIsEdge = row % 3 === 2
  const leftIsEdge = col % 3 === 0
  const rightIsEdge = col % 3 === 2

  style.borderStyle = 'solid'
  style.borderTopWidth = topIsEdge ? EDGE_WIDTH : inSelectedRow ? BAND_WIDTH : '3px'
  style.borderBottomWidth = bottomIsEdge ? EDGE_WIDTH : inSelectedRow ? BAND_WIDTH : '3px'
  style.borderLeftWidth = leftIsEdge ? EDGE_WIDTH : inSelectedCol ? BAND_WIDTH : '3px'
  style.borderRightWidth = rightIsEdge ? EDGE_WIDTH : inSelectedCol ? BAND_WIDTH : '3px'
  style.borderTopColor = topIsEdge ? 'var(--box-color)' : inSelectedRow ? 'var(--color-band-primary)' : nonEdgeBorderColor
  style.borderBottomColor = bottomIsEdge ? 'var(--box-color)' : inSelectedRow ? 'var(--color-band-primary)' : nonEdgeBorderColor
  style.borderLeftColor = leftIsEdge ? 'var(--box-color)' : inSelectedCol ? 'var(--color-band-primary)' : nonEdgeBorderColor
  style.borderRightColor = rightIsEdge ? 'var(--box-color)' : inSelectedCol ? 'var(--color-band-primary)' : nonEdgeBorderColor

  if (cell.isSelected) {
    style.boxShadow = 'inset 0 0 0 3px var(--color-ring-primary), inset 0 0 0 6px var(--color-ring-secondary)'
  } else {
    // See the module doc: on a box-boundary side that's also part of the
    // band, the border above is entirely --box-color, so add the band line
    // back in as a separate inset strip just inside that edge. At most one
    // of these four ever applies to a given cell (row-band top/bottom and
    // col-band left/right are already mutually exclusive per the module
    // doc), so there's never more than one layer here.
    const bandOnEdge: string[] = []
    if (inSelectedRow && topIsEdge) bandOnEdge.push(`inset 0 ${BAND_WIDTH} 0 0 var(--color-band-primary)`)
    if (inSelectedRow && bottomIsEdge) bandOnEdge.push(`inset 0 -${BAND_WIDTH} 0 0 var(--color-band-primary)`)
    if (inSelectedCol && leftIsEdge) bandOnEdge.push(`inset ${BAND_WIDTH} 0 0 0 var(--color-band-primary)`)
    if (inSelectedCol && rightIsEdge) bandOnEdge.push(`inset -${BAND_WIDTH} 0 0 0 var(--color-band-primary)`)
    if (bandOnEdge.length > 0) style.boxShadow = bandOnEdge.join(', ')
  }

  return style as CSSProperties
}
