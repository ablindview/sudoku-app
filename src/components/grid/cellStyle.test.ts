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
}

describe('buildCellInlineStyle', () => {
  it('sets digit color variables only when the cell has a value', () => {
    const empty = buildCellInlineStyle({ ...baseCell }, 0, 0)
    expect(empty).not.toHaveProperty('--digit-bg')

    const filled = buildCellInlineStyle({ ...baseCell, value: 5 }, 0, 0)
    expect(filled).toMatchObject({ '--digit-bg': 'var(--identity-5)', '--digit-ink': 'var(--identity-5-ink)' })
  })

  it('always sets a box-color variable keyed by 1-indexed box', () => {
    const style = buildCellInlineStyle({ ...baseCell, box: 4 }, 0, 0)
    expect(style).toMatchObject({ '--box-color': 'var(--box-outline-5)' })
  })

  it('adds a box-shadow edge only on the sides that are true box boundaries', () => {
    const topLeft = buildCellInlineStyle(baseCell, 0, 0) // row%3=0, col%3=0: top+left
    expect(topLeft.boxShadow).toContain('inset 0 3px 0 0 var(--box-color)')
    expect(topLeft.boxShadow).toContain('inset 3px 0 0 0 var(--box-color)')
    expect(topLeft.boxShadow).not.toContain('-3px 0 0 0') // no right edge
    expect(topLeft.boxShadow).not.toContain('0 -3px 0 0') // no bottom edge

    const center = buildCellInlineStyle(baseCell, 1, 1) // interior of its box: no edges
    expect(center.boxShadow).toBeUndefined()

    const bottomRight = buildCellInlineStyle(baseCell, 2, 2)
    expect(bottomRight.boxShadow).toContain('inset 0 -3px 0 0 var(--box-color)')
    expect(bottomRight.boxShadow).toContain('inset -3px 0 0 0 var(--box-color)')
  })

  it('adds a selected ring independent of box edges', () => {
    const style = buildCellInlineStyle({ ...baseCell, isSelected: true }, 1, 1)
    expect(style.boxShadow).toBe('inset 0 0 0 3px var(--color-focus-ring)')
  })

  it('adds a digit-highlight ring using the digit ink color', () => {
    const style = buildCellInlineStyle({ ...baseCell, value: 7, isDigitHighlighted: true }, 1, 1)
    expect(style.boxShadow).toBe('inset 0 0 0 3px var(--digit-ink, var(--color-text))')
  })

  it('composes all applicable shadow layers together rather than overwriting', () => {
    const style = buildCellInlineStyle(
      { ...baseCell, value: 3, isSelected: true, isDigitHighlighted: true },
      0,
      0, // top-left corner: also on both box edges
    )
    // Naive split(', ') would also split inside `var(--digit-ink, var(--color-text))`'s
    // fallback argument, so count top-level layers by their "inset" keyword instead.
    const layerCount = style.boxShadow?.match(/inset/g)?.length ?? 0
    expect(layerCount).toBe(4) // top edge, left edge, selected ring, highlight ring
    expect(style.boxShadow).toContain('inset 0 3px 0 0 var(--box-color)')
    expect(style.boxShadow).toContain('inset 3px 0 0 0 var(--box-color)')
    expect(style.boxShadow).toContain('inset 0 0 0 3px var(--color-focus-ring)')
    expect(style.boxShadow).toContain('inset 0 0 0 3px var(--digit-ink, var(--color-text))')
  })
})
