import { describe, expect, it } from 'vitest'
import { boxOf, colIndices, countGivens, createEmptyBoard, peersOf, rowIndices, toIndex, toRowCol, boxIndices } from './board'

describe('toIndex / toRowCol', () => {
  it('round-trips row/col through index', () => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        expect(toRowCol(toIndex(row, col))).toEqual({ row, col })
      }
    }
  })
})

describe('boxOf', () => {
  it('maps the 3x3 corners of box 0 to box 0', () => {
    expect(boxOf(0, 0)).toBe(0)
    expect(boxOf(2, 2)).toBe(0)
  })

  it('maps the center box correctly', () => {
    expect(boxOf(4, 4)).toBe(4)
  })

  it('maps the bottom-right corner to box 8', () => {
    expect(boxOf(8, 8)).toBe(8)
  })
})

describe('peersOf', () => {
  it('has exactly 20 peers for every cell', () => {
    for (let i = 0; i < 81; i++) {
      expect(peersOf[i]).toHaveLength(20)
    }
  })

  it('never includes the cell itself', () => {
    for (let i = 0; i < 81; i++) {
      expect(peersOf[i]).not.toContain(i)
    }
  })

  it('includes all row, column, and box peers for a sample cell', () => {
    const index = toIndex(4, 4) // center cell, box 4
    const peers = new Set(peersOf[index])
    for (const c of rowIndices(4)) if (c !== index) expect(peers.has(c)).toBe(true)
    for (const r of colIndices(4)) if (r !== index) expect(peers.has(r)).toBe(true)
    for (const b of boxIndices(4)) if (b !== index) expect(peers.has(b)).toBe(true)
  })
})

describe('countGivens', () => {
  it('counts zero for an empty board', () => {
    expect(countGivens(createEmptyBoard())).toBe(0)
  })

  it('counts non-zero cells', () => {
    const board = createEmptyBoard()
    board[0] = 5
    board[10] = 3
    expect(countGivens(board)).toBe(2)
  })
})
