import { describe, expect, it } from 'vitest'
import { computeCompletedDigits } from './completedDigits'
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

// Puzzle keeps only the nine 5s as givens; everything else starts empty.
const puzzle: Board = solution.map((v) => (v === 5 ? v : 0)) as Board
const givenMask = puzzle.map((v) => v !== 0)

function loaded() {
  return gameReducer(createIdleState(), { type: 'LOAD_PUZZLE', puzzle, solution, givenMask, difficulty: 'easy' })
}

describe('computeCompletedDigits', () => {
  it('counts a digit complete when all 9 of its solution cells are given', () => {
    const completed = computeCompletedDigits(loaded())
    expect(completed.has(5)).toBe(true)
    expect(completed.size).toBe(1)
  })

  it('does not count a digit complete until all 9 correct placements exist', () => {
    // Fill in every 3 except one — a real Sudoku solution has exactly nine 3s.
    let state = loaded()
    const threeIndices = solution.reduce<number[]>((acc, v, i) => (v === 3 ? [...acc, i] : acc), [])
    expect(threeIndices).toHaveLength(9)
    for (const index of threeIndices.slice(0, 8)) {
      state = gameReducer(state, { type: 'SET_VALUE', index, value: 3 as Digit })
    }
    expect(computeCompletedDigits(state).has(3)).toBe(false)

    state = gameReducer(state, { type: 'SET_VALUE', index: threeIndices[8], value: 3 as Digit })
    expect(computeCompletedDigits(state).has(3)).toBe(true)
  })

  it('does not count a wrong placement toward completion', () => {
    let state = loaded()
    const sevenIndices = solution.reduce<number[]>((acc, v, i) => (v === 7 ? [...acc, i] : acc), [])
    for (const index of sevenIndices.slice(0, 8)) {
      state = gameReducer(state, { type: 'SET_VALUE', index, value: 7 as Digit })
    }
    // The 9th cell gets a WRONG (but non-conflicting-with-7s) digit instead.
    const lastIndex = sevenIndices[8]
    const wrongDigit = (ALL_DIGITS_EXCEPT(solution[lastIndex] as Digit))
    state = gameReducer(state, { type: 'SET_VALUE', index: lastIndex, value: wrongDigit })
    expect(computeCompletedDigits(state).has(7)).toBe(false)
  })
})

function ALL_DIGITS_EXCEPT(exclude: Digit): Digit {
  for (let d = 1; d <= 9; d++) {
    if (d !== exclude) return d as Digit
  }
  throw new Error('unreachable')
}
