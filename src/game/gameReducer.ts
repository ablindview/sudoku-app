import { getConflicts } from '../engine/solver'
import type { CellValue } from '../engine/types'
import type { GameAction, GameState } from './gameTypes'

export const createIdleState = (): GameState => ({
  puzzle: [],
  solution: [],
  givenMask: [],
  values: [],
  notes: [],
  hintedCells: new Set(),
  conflicts: new Set(),
  selectedIndex: null,
  notesMode: false,
  difficulty: 'easy',
  status: 'idle',
  hintsUsed: 0,
  elapsedSeconds: 0,
})

const isComplete = (values: CellValue[]): boolean => values.every((v) => v !== 0)

const firstEditableIndex = (givenMask: boolean[]): number | null => {
  const index = givenMask.findIndex((given) => !given)
  return index === -1 ? null : index
}

// Pure state transitions only. Randomness (puzzle generation) happens at the
// provider boundary, which dispatches LOAD_PUZZLE with an already-generated
// puzzle — the reducer itself never calls the generator or RNG.
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'LOAD_PUZZLE': {
      const { puzzle, solution, givenMask, difficulty } = action
      const values = puzzle.slice()
      return {
        puzzle,
        solution,
        givenMask,
        values,
        notes: new Array(puzzle.length).fill(0),
        hintedCells: new Set(),
        conflicts: getConflicts(values),
        selectedIndex: firstEditableIndex(givenMask),
        notesMode: false,
        difficulty,
        status: 'playing',
        hintsUsed: 0,
        elapsedSeconds: 0,
      }
    }

    case 'SELECT_CELL': {
      if (action.index < 0 || action.index >= state.values.length) return state
      return { ...state, selectedIndex: action.index }
    }

    case 'SET_VALUE': {
      const { index, value } = action
      if (state.status !== 'playing') return state
      if (state.givenMask[index]) return state // givens are never editable

      const values = state.values.slice()
      values[index] = value
      const notes = state.notes.slice()
      notes[index] = 0 // entering a value clears any pencil marks on that cell

      const hintedCells = new Set(state.hintedCells)
      hintedCells.delete(index) // re-entered by the player: no longer just a hint

      const conflicts = getConflicts(values)
      const status = isComplete(values) && conflicts.size === 0 ? 'solved' : state.status

      return { ...state, values, notes, hintedCells, conflicts, status }
    }

    case 'CLEAR_CELL': {
      const { index } = action
      if (state.status !== 'playing') return state
      if (state.givenMask[index]) return state

      const values = state.values.slice()
      values[index] = 0

      const hintedCells = new Set(state.hintedCells)
      hintedCells.delete(index)

      const conflicts = getConflicts(values)
      return { ...state, values, hintedCells, conflicts }
    }

    case 'TOGGLE_NOTE': {
      const { index, digit } = action
      if (state.status !== 'playing') return state
      if (state.givenMask[index] || state.values[index] !== 0) return state // notes only on empty, editable cells

      const notes = state.notes.slice()
      const bit = 1 << digit
      notes[index] = notes[index] & bit ? notes[index] & ~bit : notes[index] | bit

      return { ...state, notes }
    }

    case 'TOGGLE_NOTES_MODE':
      return { ...state, notesMode: !state.notesMode }

    case 'APPLY_HINT': {
      const { index } = action
      if (state.status !== 'playing') return state
      if (state.givenMask[index]) return state
      if (state.values[index] === state.solution[index]) return state // already correct: no-op

      const values = state.values.slice()
      values[index] = state.solution[index]
      const notes = state.notes.slice()
      notes[index] = 0

      const hintedCells = new Set(state.hintedCells)
      hintedCells.add(index)

      const conflicts = getConflicts(values)
      const status = isComplete(values) && conflicts.size === 0 ? 'solved' : state.status

      return { ...state, values, notes, hintedCells, conflicts, status, hintsUsed: state.hintsUsed + 1 }
    }

    case 'TICK': {
      if (state.status !== 'playing') return state
      return { ...state, elapsedSeconds: state.elapsedSeconds + 1 }
    }

    default:
      return state
  }
}
