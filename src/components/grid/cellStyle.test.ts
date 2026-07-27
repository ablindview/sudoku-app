import { describe, expect, it } from 'vitest'
import { buildCellInlineStyle } from './cellStyle'
import type { CellDisplayState } from './cellLabel'

const baseCell: CellDisplayState = {
  index: 0,
  row: 0,
  col: 0,
  box: 0,
  value: 0,
  notesDigits: [],
  isGiven: false,
  isHinted: false,
  hasConflict: false,
  isSelected: false,
  isDigitHighlighted: false,
  isDigitComplete: false,
}

// (row, col, selectedRow, selectedCol, nonEdgeColor='transparent', focusedBox=null)
const style = (
  cell: CellDisplayState,
  row: number,
  col: number,
  selRow: number | null = null,
  selCol: number | null = null,
  focusedBox: number | null = null,
) => buildCellInlineStyle(cell, row, col, selRow, selCol, 'transparent', focusedBox)

describe('buildCellInlineStyle', () => {
  it('sets digit color variables only when the cell has a value', () => {
    const empty = style({ ...baseCell }, 0, 0)
    expect(empty).not.toHaveProperty('--digit-bg')

    const filled = style({ ...baseCell, value: 5 }, 0, 0)
    expect(filled).toMatchObject({
      '--digit-bg': 'var(--identity-5)',
      // Falls back to the normal per-digit ink everywhere except the dark
      // theme, where --color-digit-text overrides it to a flat white.
      '--digit-ink': 'var(--color-digit-text, var(--identity-5-ink))',
    })
  })

  it('swaps background and ink for a completed digit, guaranteeing the same contrast either way', () => {
    const normal = style({ ...baseCell, value: 5 }, 0, 0)
    expect(normal).toMatchObject({ '--digit-bg': 'var(--identity-5)' })

    const complete = style({ ...baseCell, value: 5, isDigitComplete: true }, 0, 0)
    // Deliberately the plain per-digit ink, not --color-digit-text — the
    // "digit complete" look is unaffected by the dark-theme text override.
    expect(complete).toMatchObject({ '--digit-bg': 'var(--identity-5-ink)', '--digit-ink': 'var(--identity-5)' })
  })

  it('always sets a box-color variable keyed by 1-indexed box', () => {
    const s = style({ ...baseCell, box: 4 }, 0, 0)
    expect(s).toMatchObject({ '--box-color': 'var(--box-outline-5)' })
  })

  describe('box-edge border (unbanded cell)', () => {
    it('colors only the true box-boundary sides, leaving the rest at the given non-edge color', () => {
      const topLeft = style(baseCell, 0, 0) // row%3=0, col%3=0: top+left are box edges
      expect(topLeft.borderTopColor).toBe('var(--box-color)')
      expect(topLeft.borderLeftColor).toBe('var(--box-color)')
      expect(topLeft.borderBottomColor).toBe('transparent')
      expect(topLeft.borderRightColor).toBe('transparent')
    })

    it('has no box edges on a box-interior cell', () => {
      const center = style(baseCell, 1, 1)
      expect(center.borderTopColor).toBe('transparent')
      expect(center.borderRightColor).toBe('transparent')
      expect(center.borderBottomColor).toBe('transparent')
      expect(center.borderLeftColor).toBe('transparent')
    })

    it('colors bottom+right edges for a box bottom-right corner cell', () => {
      const bottomRight = style(baseCell, 2, 2)
      expect(bottomRight.borderBottomColor).toBe('var(--box-color)')
      expect(bottomRight.borderRightColor).toBe('var(--box-color)')
    })

    it('uses the caller-supplied non-edge color (Mode B passes a visible gray, not transparent)', () => {
      const s = buildCellInlineStyle(baseCell, 1, 1, null, null, 'var(--color-border)', null)
      expect(s.borderTopColor).toBe('var(--color-border)')
    })

    it('gives non-edge sides the normal 3px width when unbanded', () => {
      const s = style(baseCell, 1, 1)
      expect(s.borderTopWidth).toBe('3px')
      expect(s.borderRightWidth).toBe('3px')
    })
  })

  describe('focused box (bright red edge override, replacing the earlier scale/shadow lift)', () => {
    it('overrides --box-color to the focused-box red for a cell in the focused box', () => {
      const s = style({ ...baseCell, box: 4 }, 4, 4, null, null, 4)
      expect(s).toMatchObject({ '--box-color': 'var(--color-focused-box)' })
    })

    it('keeps the normal per-box identity color for a cell outside the focused box', () => {
      const s = style({ ...baseCell, box: 4 }, 4, 4, null, null, 0)
      expect(s).toMatchObject({ '--box-color': 'var(--box-outline-5)' })
    })

    it('keeps the normal per-box identity color when no box is focused', () => {
      const s = style({ ...baseCell, box: 4 }, 4, 4, null, null, null)
      expect(s).toMatchObject({ '--box-color': 'var(--box-outline-5)' })
    })

    it('still only colors the true box-boundary sides of a focused-box cell, leaving interior sides at the non-edge color', () => {
      const topLeft = style({ ...baseCell, box: 0 }, 0, 0, null, null, 0) // row%3=0,col%3=0: top+left are edges
      expect(topLeft.borderTopColor).toBe('var(--box-color)')
      expect(topLeft.borderLeftColor).toBe('var(--box-color)')
      expect(topLeft.borderBottomColor).toBe('transparent')
      expect(topLeft.borderRightColor).toBe('transparent')
    })

    it('applies to the selected cell too — the focused box includes the selected cell itself', () => {
      const s = style({ ...baseCell, box: 4, isSelected: true }, 4, 4, null, null, 4)
      expect(s).toMatchObject({ '--box-color': 'var(--color-focused-box)' })
      // and its own ring is untouched by this
      expect(s.boxShadow).toBe(
        'inset 0 0 0 3px var(--color-ring-primary), inset 0 0 0 6px var(--color-ring-secondary)',
      )
    })

    it('thickens the true box-boundary sides of a focused-box cell to 5px, a non-color signal for the two contrast themes', () => {
      // In contrast-light/contrast-dark, --color-focused-box deliberately
      // equals the theme's one fixed box-outline color (no hue introduced),
      // so thickness is the only thing that differentiates the focused box
      // there — this must not regress to a uniform 3px everywhere.
      const topLeft = style({ ...baseCell, box: 0 }, 0, 0, null, null, 0) // row%3=0,col%3=0: top+left are edges
      expect(topLeft.borderTopWidth).toBe('5px')
      expect(topLeft.borderLeftWidth).toBe('5px')
      expect(topLeft.borderBottomWidth).toBe('3px')
      expect(topLeft.borderRightWidth).toBe('3px')
    })

    it('keeps the normal 3px edge width for a cell outside the focused box', () => {
      const topLeft = style({ ...baseCell, box: 0 }, 0, 0, null, null, 5)
      expect(topLeft.borderTopWidth).toBe('3px')
      expect(topLeft.borderLeftWidth).toBe('3px')
    })
  })

  describe('selected-cell ring (box-shadow)', () => {
    it('gives the selected cell a primary-then-secondary double ring on all four sides', () => {
      const s = style({ ...baseCell, isSelected: true }, 4, 4)
      expect(s.boxShadow).toBe(
        'inset 0 0 0 3px var(--color-ring-primary), inset 0 0 0 6px var(--color-ring-secondary)',
      )
    })

    it('has no box-shadow at all for an ordinary cell outside the selection', () => {
      const s = style(baseCell, 4, 4, 0, 0)
      expect(s.boxShadow).toBeUndefined()
    })

    it('has no box-shadow for a banded cell either — that uses border, not shadow', () => {
      const banded = style(baseCell, 4, 2, 4, 7) // row 4 matches selectedRow
      expect(banded.boxShadow).toBeUndefined()
    })
  })

  describe('same-digit highlight (flat bg/text swap, not a ring)', () => {
    it('drops the identity color and shows the flat highlight bg/text pair for a same-digit-highlighted cell', () => {
      const s = style({ ...baseCell, value: 7, isDigitHighlighted: true }, 4, 4)
      expect(s).toMatchObject({
        '--digit-bg': 'var(--color-highlight-bg)',
        '--digit-ink': 'var(--color-highlight-text)',
      })
      // no ring or extra border/outline signal — the bg/text swap is the entire signal
      expect(s.boxShadow).toBeUndefined()
    })

    it('takes priority over the digit-complete swap when a cell is somehow both', () => {
      const s = style({ ...baseCell, value: 7, isDigitHighlighted: true, isDigitComplete: true }, 4, 4)
      expect(s).toMatchObject({
        '--digit-bg': 'var(--color-highlight-bg)',
        '--digit-ink': 'var(--color-highlight-text)',
      })
    })

    it('leaves an ordinary, non-highlighted filled cell with its normal identity color', () => {
      const s = style({ ...baseCell, value: 7 }, 4, 4)
      expect(s).toMatchObject({ '--digit-bg': 'var(--identity-7)' })
    })
  })

  describe('row/column band (per-side border, coexists with the box edge on the same cell)', () => {
    it('colors the non-edge sides of a banded interior cell with the flat theme-default color, at 4px', () => {
      const s = style(baseCell, 4, 4, 4, 7) // row 4 matches selectedRow; row%3=1,col%3=1 -> a true box-interior cell
      expect(s.borderTopColor).toBe('var(--color-band-primary)')
      expect(s.borderTopWidth).toBe('4px')
      expect(s.borderBottomColor).toBe('var(--color-band-primary)')
      expect(s.borderLeftColor).toBe('var(--color-band-primary)')
      expect(s.borderRightColor).toBe('var(--color-band-primary)')
    })

    it('bands a cell in the focused column the same way', () => {
      const s = style(baseCell, 1, 7, 4, 7) // col 7 matches selectedCol, row 1 != selectedRow 4
      expect(s.borderTopColor).toBe('var(--color-band-primary)')
    })

    it('gives the selected cell no band coloring on its non-edge sides (it already has its own ring)', () => {
      const s = style({ ...baseCell, isSelected: true }, 4, 7, 4, 7)
      expect(s.borderTopColor).toBe('transparent') // falls back to the caller's non-edge color
    })

    it('gives no band coloring to a cell outside the focused row/column', () => {
      const s = style(baseCell, 4, 4, 0, 0)
      expect(s.borderTopColor).toBe('transparent')
      expect(s.borderTopWidth).toBe('3px')
    })

    it('uses the same flat theme-default color for a filled cell in the band, not its own digit-ink', () => {
      // A uniform look was requested over the earlier per-cell contrast-matched
      // approach (which reused each cell's own --digit-ink) — every band cell
      // now shows the same color regardless of what digit it holds.
      const s = style({ ...baseCell, value: 5 }, 4, 2, 4, 7)
      expect(s.borderTopColor).toBe('var(--color-band-primary)')
    })

    it('uses the same flat color for a completed digit in the band too', () => {
      const s = style({ ...baseCell, value: 5, isDigitComplete: true }, 4, 2, 4, 7)
      expect(s.borderTopColor).toBe('var(--color-band-primary)')
    })

    it('shows red on the box-boundary side and the band color on the rest, on the same focused-box perimeter cell', () => {
      // row 0, col 1 is box 0's top-center perimeter cell (row%3=0 -> a red
      // top edge, col%3=1 -> left/right are non-edge); row 0 also matches
      // selectedRow, so its non-edge sides qualify for the band.
      const s = style({ ...baseCell, box: 0 }, 0, 1, 0, 7, 0)
      expect(s.borderTopColor).toBe('var(--box-color)')
      expect(s).toMatchObject({ '--box-color': 'var(--color-focused-box)' })
      expect(s.borderLeftColor).toBe('var(--color-band-primary)')
      expect(s.borderRightColor).toBe('var(--color-band-primary)')
    })

    it('bands all four sides of the focused box\'s own center cell, which has no red edge at all', () => {
      // row 1, col 1 is box 0's center — never gets a red border on any
      // side, so there's nothing for the band color to compete with.
      const s = style({ ...baseCell, box: 0 }, 1, 1, 1, 7, 0)
      expect(s.borderTopColor).toBe('var(--color-band-primary)')
      expect(s.borderLeftColor).toBe('var(--color-band-primary)')
      expect(s.borderBottomColor).toBe('var(--color-band-primary)')
      expect(s.borderRightColor).toBe('var(--color-band-primary)')
    })

    it('still bands a cell in the focused row/column that is outside the focused box, unaffected by red', () => {
      // row 1, col 7: row%3=1 so top/bottom aren't true box edges regardless
      // of which box is focused — a clean non-edge side to check band color on.
      const s = style({ ...baseCell, box: 5 }, 1, 7, 1, 7, 0) // box 0 focused, this cell is box 5
      expect(s.borderTopColor).toBe('var(--color-band-primary)')
    })
  })
})
