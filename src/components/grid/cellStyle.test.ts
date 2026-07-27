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
    expect(filled).toMatchObject({ '--digit-bg': 'var(--identity-5)', '--digit-ink': 'var(--identity-5-ink)' })
  })

  it('swaps background and ink for a completed digit, guaranteeing the same contrast either way', () => {
    const normal = style({ ...baseCell, value: 5 }, 0, 0)
    expect(normal).toMatchObject({ '--digit-bg': 'var(--identity-5)', '--digit-ink': 'var(--identity-5-ink)' })

    const complete = style({ ...baseCell, value: 5, isDigitComplete: true }, 0, 0)
    expect(complete).toMatchObject({ '--digit-bg': 'var(--identity-5-ink)', '--digit-ink': 'var(--identity-5)' })
  })

  it('always sets a box-color variable keyed by 1-indexed box', () => {
    const s = style({ ...baseCell, box: 4 }, 0, 0)
    expect(s).toMatchObject({ '--box-color': 'var(--box-outline-5)' })
  })

  describe('box-edge border', () => {
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

    it('has no box-shadow for a digit-highlighted or banded cell either — those use outline, not shadow', () => {
      const highlighted = style({ ...baseCell, value: 7, isDigitHighlighted: true }, 4, 4)
      expect(highlighted.boxShadow).toBeUndefined()

      const banded = style(baseCell, 4, 2, 4, 7) // row 4 matches selectedRow
      expect(banded.boxShadow).toBeUndefined()
    })
  })

  describe('same-digit highlight (flat bright purple outline)', () => {
    const highlightOutline = { outlineStyle: 'solid', outlineWidth: '4px', outlineOffset: '-4px' }

    it('outlines a same-digit-highlighted cell in the flat highlight color', () => {
      const s = style({ ...baseCell, value: 7, isDigitHighlighted: true }, 4, 4)
      expect(s).toMatchObject({ ...highlightOutline, outlineColor: 'var(--color-highlight)' })
    })

    it('does not outline an ordinary, non-highlighted cell', () => {
      const s = style(baseCell, 4, 4, 0, 0)
      expect(s.outlineColor).toBeUndefined()
    })
  })

  describe('row/column band (flat theme-default outline, uniform for every cell)', () => {
    const bandOutline = { outlineStyle: 'solid', outlineWidth: '4px', outlineOffset: '-4px' }

    it('outlines a non-selected cell in the focused row with the theme default color', () => {
      const s = style(baseCell, 4, 2, 4, 7) // row 4 matches selectedRow, col 2 != selectedCol 7
      expect(s).toMatchObject({ ...bandOutline, outlineColor: 'var(--color-band-primary)' })
    })

    it('outlines a non-selected cell in the focused column with the theme default color', () => {
      const s = style(baseCell, 1, 7, 4, 7) // col 7 matches selectedCol, row 1 != selectedRow 4
      expect(s).toMatchObject({ ...bandOutline, outlineColor: 'var(--color-band-primary)' })
    })

    it('gives the selected cell no band outline (it already has its own ring)', () => {
      const s = style({ ...baseCell, isSelected: true }, 4, 7, 4, 7)
      expect(s.outlineColor).toBeUndefined()
    })

    it('gives no band outline to a cell outside the focused row/column', () => {
      const s = style(baseCell, 4, 4, 0, 0)
      expect(s.outlineColor).toBeUndefined()
    })

    it('uses the same flat theme-default color for a filled cell in the band, not its own digit-ink', () => {
      // A uniform look was requested over the earlier per-cell contrast-matched
      // approach (which reused each cell's own --digit-ink) — every band cell
      // now shows the same color regardless of what digit it holds.
      const s = style({ ...baseCell, value: 5 }, 4, 2, 4, 7)
      expect(s).toMatchObject({ ...bandOutline, outlineColor: 'var(--color-band-primary)' })
    })

    it('uses the same flat color for a completed digit in the band too', () => {
      const s = style({ ...baseCell, value: 5, isDigitComplete: true }, 4, 2, 4, 7)
      expect(s).toMatchObject({ ...bandOutline, outlineColor: 'var(--color-band-primary)' })
    })
  })

  describe('composition', () => {
    it('composes the focused-box red edge with the row/column band outline on a non-selected cell in both', () => {
      // row 4, col 2 is box 3 (boxOf(4,2) === 3); row 4 matches selectedRow, col 2 != selectedCol 7
      const s = style({ ...baseCell, box: 3 }, 4, 2, 4, 7, 3)
      expect(s).toMatchObject({ '--box-color': 'var(--color-focused-box)', outlineColor: 'var(--color-band-primary)' })
    })

    it('composes the focused-box red edge with the same-digit highlight outline', () => {
      const s = style({ ...baseCell, box: 4, value: 7, isDigitHighlighted: true }, 4, 4, null, null, 4)
      expect(s).toMatchObject({ '--box-color': 'var(--color-focused-box)', outlineColor: 'var(--color-highlight)' })
    })
  })
})
