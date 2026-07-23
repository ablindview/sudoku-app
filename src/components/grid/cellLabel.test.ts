import { describe, expect, it } from 'vitest'
import { buildCellState, gridCellLabel, inputCellLabel } from './cellLabel'
import { createIdleState, gameReducer } from '../../game/gameReducer'
import type { Board, Digit } from '../../engine/types'

const solution: Board = [
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
const puzzle: Board = solution.map((v, i) => (i === 0 ? v : 0)) as Board
const givenMask = puzzle.map((v) => v !== 0)

function loaded() {
  return gameReducer(createIdleState(), { type: 'LOAD_PUZZLE', puzzle, solution, givenMask, difficulty: 'easy' })
}

describe('buildCellState', () => {
  it('reflects given/value/position for a given cell', () => {
    const cell = buildCellState(loaded(), 0)
    expect(cell.row).toBe(0)
    expect(cell.col).toBe(0)
    expect(cell.box).toBe(0)
    expect(cell.value).toBe(5)
    expect(cell.isGiven).toBe(true)
  })

  it('reflects notes on an empty editable cell', () => {
    const withNote = gameReducer(loaded(), { type: 'TOGGLE_NOTE', index: 1, digit: 3 as Digit })
    const cell = buildCellState(withNote, 1)
    expect(cell.notesDigits).toEqual([3])
    expect(cell.value).toBe(0)
  })

  it('reflects hinted state', () => {
    const hinted = gameReducer(loaded(), { type: 'APPLY_HINT', index: 1 })
    const cell = buildCellState(hinted, 1)
    expect(cell.isHinted).toBe(true)
    expect(cell.value).toBe(solution[1])
  })

  it('reflects conflict state', () => {
    const conflicted = gameReducer(loaded(), { type: 'SET_VALUE', index: 1, value: 5 })
    expect(buildCellState(conflicted, 0).hasConflict).toBe(true)
    expect(buildCellState(conflicted, 1).hasConflict).toBe(true)
  })

  it('reflects selection', () => {
    const state = gameReducer(loaded(), { type: 'SELECT_CELL', index: 42 })
    expect(buildCellState(state, 42).isSelected).toBe(true)
    expect(buildCellState(state, 41).isSelected).toBe(false)
  })
})

describe('gridCellLabel (Mode A)', () => {
  it('includes value for a given cell', () => {
    expect(gridCellLabel(buildCellState(loaded(), 0))).toBe('Row 1, column 1, value 5, given')
  })

  it('says empty for an unfilled cell', () => {
    expect(gridCellLabel(buildCellState(loaded(), 1))).toBe('Row 1, column 2, empty')
  })

  it('includes notes when present', () => {
    const withNotes = gameReducer(
      gameReducer(loaded(), { type: 'TOGGLE_NOTE', index: 1, digit: 2 as Digit }),
      { type: 'TOGGLE_NOTE', index: 1, digit: 7 as Digit },
    )
    expect(gridCellLabel(buildCellState(withNotes, 1))).toBe('Row 1, column 2, empty, notes 2, 7')
  })

  it('includes conflict state', () => {
    const conflicted = gameReducer(loaded(), { type: 'SET_VALUE', index: 1, value: 5 })
    expect(gridCellLabel(buildCellState(conflicted, 1))).toBe('Row 1, column 2, value 5, conflict')
  })
})

describe('inputCellLabel (Mode B)', () => {
  it('omits the value (native input announces it)', () => {
    expect(inputCellLabel(buildCellState(loaded(), 0))).toBe('Row 1, column 1, given')
    expect(inputCellLabel(buildCellState(loaded(), 1))).toBe('Row 1, column 2')
  })
})
