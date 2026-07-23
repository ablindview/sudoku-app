import type { Board, CellValue, Difficulty, Digit } from '../engine/types'

export type GameStatus = 'idle' | 'playing' | 'solved'

export interface GameState {
  puzzle: Board
  solution: Board
  givenMask: boolean[]
  values: CellValue[]
  notes: number[] // bitmask per cell, bits 1-9 (bit `1 << digit` set = pencil mark present)
  hintedCells: Set<number> // cells revealed via APPLY_HINT (distinct from given/player-entered)
  conflicts: Set<number>
  selectedIndex: number | null
  notesMode: boolean
  difficulty: Difficulty
  status: GameStatus
  hintsUsed: number
  elapsedSeconds: number
}

export type GameAction =
  | { type: 'LOAD_PUZZLE'; puzzle: Board; solution: Board; givenMask: boolean[]; difficulty: Difficulty }
  | { type: 'SELECT_CELL'; index: number }
  | { type: 'SET_VALUE'; index: number; value: CellValue }
  | { type: 'CLEAR_CELL'; index: number }
  | { type: 'TOGGLE_NOTE'; index: number; digit: Digit }
  | { type: 'TOGGLE_NOTES_MODE' }
  | { type: 'APPLY_HINT'; index: number }
  | { type: 'TICK' }

export const noteHasDigit = (notesMask: number, digit: Digit): boolean => (notesMask & (1 << digit)) !== 0

export const digitsInNotesMask = (notesMask: number): Digit[] => {
  const digits: Digit[] = []
  for (let d = 1; d <= 9; d++) {
    if (noteHasDigit(notesMask, d as Digit)) digits.push(d as Digit)
  }
  return digits
}
