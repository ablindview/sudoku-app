import { describe, expect, it } from 'vitest'
import type { Board } from './types'
import { countSolutions, getCandidates, getConflicts, hasUniqueSolution, isValidPlacement, solve } from './solver'
import { createEmptyBoard } from './board'

// Classic example puzzle/solution pair (Wikipedia "Sudoku").
const PUZZLE: Board = [
  5, 3, 0, 0, 7, 0, 0, 0, 0,
  6, 0, 0, 1, 9, 5, 0, 0, 0,
  0, 9, 8, 0, 0, 0, 0, 6, 0,
  8, 0, 0, 0, 6, 0, 0, 0, 3,
  4, 0, 0, 8, 0, 3, 0, 0, 1,
  7, 0, 0, 0, 2, 0, 0, 0, 6,
  0, 6, 0, 0, 0, 0, 2, 8, 0,
  0, 0, 0, 4, 1, 9, 0, 0, 5,
  0, 0, 0, 0, 8, 0, 0, 7, 9,
]

const SOLUTION: Board = [
  5, 3, 4, 6, 7, 8, 9, 1, 2,
  6, 7, 2, 1, 9, 5, 3, 4, 8,
  1, 9, 8, 3, 4, 2, 5, 6, 7,
  8, 5, 9, 7, 6, 1, 4, 2, 3,
  4, 2, 6, 8, 5, 3, 7, 9, 1,
  7, 1, 3, 9, 2, 4, 8, 5, 6,
  9, 6, 1, 5, 3, 7, 2, 8, 4,
  2, 8, 7, 4, 1, 9, 6, 3, 5,
  3, 4, 5, 2, 8, 6, 1, 7, 9,
]

describe('isValidPlacement', () => {
  it('rejects a value that already exists in the same row', () => {
    expect(isValidPlacement(PUZZLE, 2, 5)).toBe(false) // row 0 already has a 5
  })

  it('accepts a value with no conflicting peer', () => {
    expect(isValidPlacement(PUZZLE, 2, 4)).toBe(true)
  })
})

describe('solve', () => {
  it('solves the classic example puzzle to its known solution', () => {
    expect(solve(PUZZLE)).toEqual(SOLUTION)
  })

  it('returns the same board (already solved) when given a full solution', () => {
    expect(solve(SOLUTION)).toEqual(SOLUTION)
  })

  it('returns null for an unsolvable board', () => {
    const board = createEmptyBoard()
    board[0] = 5
    board[1] = 5 // two 5s in the same row: unsolvable
    expect(solve(board)).toBeNull()
  })

  it('does not mutate the input board', () => {
    const copy = PUZZLE.slice()
    solve(PUZZLE)
    expect(PUZZLE).toEqual(copy)
  })
})

describe('countSolutions / hasUniqueSolution', () => {
  it('finds exactly one solution for the classic puzzle', () => {
    expect(countSolutions(PUZZLE)).toBe(1)
    expect(hasUniqueSolution(PUZZLE)).toBe(true)
  })

  it('finds more than one solution for a near-empty board', () => {
    const board = createEmptyBoard()
    board[0] = 5 // barely constrained: many valid completions
    expect(countSolutions(board, 2)).toBe(2)
    expect(hasUniqueSolution(board)).toBe(false)
  })

  it('respects the limit argument and stops early', () => {
    const board = createEmptyBoard()
    expect(countSolutions(board, 1)).toBe(1)
  })
})

describe('getConflicts', () => {
  it('returns empty for a valid partial board', () => {
    expect(getConflicts(PUZZLE).size).toBe(0)
  })

  it('flags a row duplicate', () => {
    const board = createEmptyBoard()
    board[0] = 5
    board[1] = 5
    const conflicts = getConflicts(board)
    expect(conflicts.has(0)).toBe(true)
    expect(conflicts.has(1)).toBe(true)
  })

  it('flags a column duplicate', () => {
    const board = createEmptyBoard()
    board[0] = 7 // (0,0)
    board[9] = 7 // (1,0)
    const conflicts = getConflicts(board)
    expect(conflicts.has(0)).toBe(true)
    expect(conflicts.has(9)).toBe(true)
  })

  it('flags a box duplicate', () => {
    const board = createEmptyBoard()
    board[0] = 3 // (0,0), box 0
    board[10] = 3 // (1,1), box 0
    const conflicts = getConflicts(board)
    expect(conflicts.has(0)).toBe(true)
    expect(conflicts.has(10)).toBe(true)
  })

  it('never consults a solution (pure rule check on the board as-is)', () => {
    // A board that deviates from any solution but has no row/col/box duplicate
    // should report zero conflicts.
    const board = createEmptyBoard()
    board[0] = 9 // Wikipedia solution has 5 here; still no rule violation alone
    expect(getConflicts(board).size).toBe(0)
  })
})

describe('getCandidates', () => {
  it('returns empty for an already-filled cell', () => {
    expect(getCandidates(PUZZLE, 0)).toEqual(new Set())
  })

  it('returns the correct candidate set for an empty cell', () => {
    // Cell (0,2) is empty in PUZZLE; solution says it should be 4.
    const candidates = getCandidates(PUZZLE, 2)
    expect(candidates.has(4)).toBe(true)
  })
})
