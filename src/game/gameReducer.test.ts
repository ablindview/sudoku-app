import { describe, expect, it } from 'vitest'
import { createIdleState, gameReducer } from './gameReducer'
import type { Board, Digit } from '../engine/types'
import type { GameState } from './gameTypes'

// A real, fully valid solved grid (classic Wikipedia example), so filling all
// cells to match it in the "solved status" test produces zero conflicts.
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

// Puzzle keeps only index 0 as a given; everything else starts empty.
const puzzle: Board = solution.map((v, i) => (i === 0 ? v : 0)) as Board
const givenMask = puzzle.map((v) => v !== 0)

function loaded(): GameState {
  return gameReducer(createIdleState(), {
    type: 'LOAD_PUZZLE',
    puzzle,
    solution,
    givenMask,
    difficulty: 'easy',
  })
}

describe('LOAD_PUZZLE', () => {
  it('initializes values from the puzzle and status to playing', () => {
    const state = loaded()
    expect(state.values).toEqual(puzzle)
    expect(state.status).toBe('playing')
    expect(state.hintsUsed).toBe(0)
    expect(state.elapsedSeconds).toBe(0)
    expect(state.notes.every((n) => n === 0)).toBe(true)
  })

  it('selects the first editable (non-given) cell', () => {
    const state = loaded()
    expect(state.selectedIndex).toBe(1) // index 0 is given
  })
})

describe('SET_VALUE', () => {
  it('sets a value on an editable cell', () => {
    const state = gameReducer(loaded(), { type: 'SET_VALUE', index: 1, value: 2 })
    expect(state.values[1]).toBe(2)
  })

  it('is a no-op on a given cell', () => {
    const before = loaded()
    const after = gameReducer(before, { type: 'SET_VALUE', index: 0, value: 9 })
    expect(after.values[0]).toBe(5)
    expect(after).toBe(before) // unchanged reference: true no-op
  })

  it('clears notes on that cell when a value is entered', () => {
    const withNote = gameReducer(loaded(), { type: 'TOGGLE_NOTE', index: 1, digit: 3 as Digit })
    expect(withNote.notes[1]).not.toBe(0)
    const withValue = gameReducer(withNote, { type: 'SET_VALUE', index: 1, value: 5 })
    expect(withValue.notes[1]).toBe(0)
  })

  it('recomputes conflicts after setting a value', () => {
    // index 1 is in the same row as index 0 (value 5); setting index1 to 5 conflicts.
    const state = gameReducer(loaded(), { type: 'SET_VALUE', index: 1, value: 5 })
    expect(state.conflicts.has(0)).toBe(true)
    expect(state.conflicts.has(1)).toBe(true)
  })

  it('un-hints a cell when the player re-enters it manually', () => {
    const hinted = gameReducer(loaded(), { type: 'APPLY_HINT', index: 1 })
    expect(hinted.hintedCells.has(1)).toBe(true)
    const reEntered = gameReducer(hinted, { type: 'SET_VALUE', index: 1, value: 2 })
    expect(reEntered.hintedCells.has(1)).toBe(false)
  })
})

describe('CLEAR_CELL', () => {
  it('clears a player-entered value', () => {
    const withValue = gameReducer(loaded(), { type: 'SET_VALUE', index: 1, value: 2 })
    const cleared = gameReducer(withValue, { type: 'CLEAR_CELL', index: 1 })
    expect(cleared.values[1]).toBe(0)
  })

  it('is a no-op on a given cell', () => {
    const before = loaded()
    const after = gameReducer(before, { type: 'CLEAR_CELL', index: 0 })
    expect(after).toBe(before)
  })
})

describe('TOGGLE_NOTE', () => {
  it('toggles a pencil mark bit on and off', () => {
    const on = gameReducer(loaded(), { type: 'TOGGLE_NOTE', index: 1, digit: 4 as Digit })
    expect(on.notes[1] & (1 << 4)).toBeTruthy()
    const off = gameReducer(on, { type: 'TOGGLE_NOTE', index: 1, digit: 4 as Digit })
    expect(off.notes[1] & (1 << 4)).toBeFalsy()
  })

  it('is a no-op on a given cell', () => {
    const before = loaded()
    const after = gameReducer(before, { type: 'TOGGLE_NOTE', index: 0, digit: 4 as Digit })
    expect(after).toBe(before)
  })

  it('is a no-op on a cell that already has a value', () => {
    const withValue = gameReducer(loaded(), { type: 'SET_VALUE', index: 1, value: 2 })
    const after = gameReducer(withValue, { type: 'TOGGLE_NOTE', index: 1, digit: 4 as Digit })
    expect(after).toBe(withValue)
  })
})

describe('TOGGLE_NOTES_MODE', () => {
  it('flips notesMode', () => {
    const state = loaded()
    expect(state.notesMode).toBe(false)
    expect(gameReducer(state, { type: 'TOGGLE_NOTES_MODE' }).notesMode).toBe(true)
  })
})

describe('APPLY_HINT', () => {
  it('reveals the solution value and marks the cell as hinted', () => {
    const state = gameReducer(loaded(), { type: 'APPLY_HINT', index: 1 })
    expect(state.values[1]).toBe(solution[1])
    expect(state.hintedCells.has(1)).toBe(true)
    expect(state.hintsUsed).toBe(1)
  })

  it('is a no-op on a given cell', () => {
    const before = loaded()
    const after = gameReducer(before, { type: 'APPLY_HINT', index: 0 })
    expect(after).toBe(before)
  })
})

describe('TICK', () => {
  it('increments elapsedSeconds while playing', () => {
    const state = gameReducer(loaded(), { type: 'TICK' })
    expect(state.elapsedSeconds).toBe(1)
  })

  it('is a no-op when not playing', () => {
    const idle = createIdleState()
    expect(gameReducer(idle, { type: 'TICK' })).toBe(idle)
  })
})

describe('solved status', () => {
  it('transitions to solved when the board is complete with no conflicts', () => {
    let state = loaded()
    for (let i = 1; i < 81; i++) {
      state = gameReducer(state, { type: 'SET_VALUE', index: i, value: solution[i] as Digit })
    }
    expect(state.status).toBe('solved')
  })
})
