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

// (row, col, selectedRow, selectedCol, nonEdgeColor='transparent')
const style = (cell: CellDisplayState, row: number, col: number, selRow: number | null = null, selCol: number | null = null) =>
  buildCellInlineStyle(cell, row, col, selRow, selCol, 'transparent')

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
      const s = buildCellInlineStyle(baseCell, 1, 1, null, null, 'var(--color-border)')
      expect(s.borderTopColor).toBe('var(--color-border)')
    })
  })

  describe('box-shadow rings (selected / digit-highlight / row-col band)', () => {
    it('gives the selected cell a primary-then-secondary double ring on all four sides', () => {
      const s = style({ ...baseCell, isSelected: true }, 4, 4)
      expect(s.boxShadow).toBe(
        'inset 0 0 0 3px var(--color-ring-primary), inset 0 0 0 6px var(--color-ring-secondary)',
      )
    })

    it('gives a same-digit-highlighted cell the same themed ring pair, not its own ink color', () => {
      // Reusing --digit-ink here would blend the "you're highlighted" ring
      // into the digit's own already-visible text color instead of reading
      // as a distinct signal — see the module doc for why this was changed.
      const s = style({ ...baseCell, value: 7, isDigitHighlighted: true }, 4, 4)
      expect(s.boxShadow).toBe(
        'inset 0 0 0 4px var(--color-ring-primary), inset 0 0 0 7px var(--color-ring-secondary)',
      )
    })

    it('gives a non-selected cell in the focused row a top+bottom double-line band', () => {
      const s = style(baseCell, 4, 2, 4, 7) // row 4 matches selectedRow, col 2 != selectedCol 7
      expect(s.boxShadow).toContain('inset 0 4px 0 0 var(--color-ring-primary)')
      expect(s.boxShadow).toContain('inset 0 7px 0 0 var(--color-ring-secondary)')
      expect(s.boxShadow).toContain('inset 0 -4px 0 0 var(--color-ring-primary)')
      expect(s.boxShadow).toContain('inset 0 -7px 0 0 var(--color-ring-secondary)')
      expect(s.boxShadow).not.toContain('inset 4px 0 0 0') // no column band
    })

    it('gives a non-selected cell in the focused column a left+right double-line band', () => {
      const s = style(baseCell, 1, 7, 4, 7) // col 7 matches selectedCol, row 1 != selectedRow 4
      expect(s.boxShadow).toContain('inset 4px 0 0 0 var(--color-ring-primary)')
      expect(s.boxShadow).toContain('inset 7px 0 0 0 var(--color-ring-secondary)')
      expect(s.boxShadow).toContain('inset -4px 0 0 0 var(--color-ring-primary)')
      expect(s.boxShadow).toContain('inset -7px 0 0 0 var(--color-ring-secondary)')
      expect(s.boxShadow).not.toContain('inset 0 4px 0 0') // no row band
    })

    it('gives the selected cell no row/col band (it already has its own ring)', () => {
      const s = style({ ...baseCell, isSelected: true }, 4, 7, 4, 7)
      expect(s.boxShadow).toBe(
        'inset 0 0 0 3px var(--color-ring-primary), inset 0 0 0 6px var(--color-ring-secondary)',
      )
    })

    it('has no box-shadow at all for an ordinary cell outside the selection', () => {
      const s = style(baseCell, 4, 4, 0, 0)
      expect(s.boxShadow).toBeUndefined()
    })
  })
})
