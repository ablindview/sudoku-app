import { ALL_DIGITS, type Board, type Difficulty, type Digit } from './types'
import { CELL_COUNT, cloneBoard, createEmptyBoard, countGivens, peersOf } from './board'
import { hasUniqueSolution } from './solver'
import { createRng, shuffledIndices, type Rng } from './rng'

export interface DifficultyConfig {
  minGivens: number
  targetGivens: number
  maxGivens: number
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { minGivens: 38, targetGivens: 42, maxGivens: 46 },
  medium: { minGivens: 30, targetGivens: 33, maxGivens: 37 },
  hard: { minGivens: 24, targetGivens: 27, maxGivens: 29 },
}

export interface GeneratedPuzzle {
  puzzle: Board
  solution: Board
  givenMask: boolean[]
  difficulty: Difficulty
}

const FULL_MASK = 0b1111111110
const bitFor = (digit: Digit): number => 1 << digit

const candidateMask = (board: Board, index: number): number => {
  let used = 0
  for (const peer of peersOf[index]) {
    const v = board[peer]
    if (v !== 0) used |= bitFor(v as Digit)
  }
  return FULL_MASK & ~used
}

const digitsFromMask = (mask: number): Digit[] => ALL_DIGITS.filter((d) => mask & bitFor(d))

function shuffleDigitsList(digits: Digit[], rng: Rng): Digit[] {
  const result = digits.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Randomized backtracking fill of a full, valid, empty-cell-free board. */
export function generateSolvedBoard(rng: Rng = createRng(Date.now())): Board {
  const board = createEmptyBoard()
  const filled = fillCells(board, rng)
  if (!filled) {
    // Astronomically unlikely for a 9x9 grid with MRV backtracking, but fail loudly
    // rather than silently returning an invalid board.
    throw new Error('Failed to generate a solved Sudoku board')
  }
  return board
}

function fillCells(board: Board, rng: Rng): boolean {
  let bestIndex = -1
  let bestMask = -1
  let bestCount = Infinity

  for (let index = 0; index < CELL_COUNT; index++) {
    if (board[index] !== 0) continue
    const mask = candidateMask(board, index)
    const count = popcount(mask)
    if (count < bestCount) {
      bestIndex = index
      bestMask = mask
      bestCount = count
      if (count === 0) break
    }
  }

  if (bestIndex === -1) return true // no empty cells left: solved
  if (bestMask === 0) return false

  const digits = shuffleDigitsList(digitsFromMask(bestMask), rng)
  for (const digit of digits) {
    board[bestIndex] = digit
    if (fillCells(board, rng)) return true
    board[bestIndex] = 0
  }
  return false
}

function popcount(mask: number): number {
  let count = 0
  let m = mask
  while (m) {
    m &= m - 1
    count++
  }
  return count
}

/**
 * Removes cells from a full solution one at a time (in random order), keeping a
 * removal only if the puzzle still has a unique solution afterward. Stops once
 * the difficulty's target given-count is reached or the removal order is
 * exhausted. If the target can't be reached (rare, mostly relevant for `hard`),
 * it returns the best (slightly-too-easy-but-still-unique) puzzle found rather
 * than hanging or throwing.
 */
export function generatePuzzle(difficulty: Difficulty, rng: Rng = createRng(Date.now())): GeneratedPuzzle {
  const solution = generateSolvedBoard(rng)
  const puzzle = cloneBoard(solution)
  const config = DIFFICULTY_CONFIGS[difficulty]

  const removalOrder = shuffledIndices(CELL_COUNT, rng)

  for (const index of removalOrder) {
    if (countGivens(puzzle) <= config.targetGivens) break

    const removedValue = puzzle[index]
    puzzle[index] = 0

    if (!hasUniqueSolution(puzzle)) {
      puzzle[index] = removedValue // restore: removing this cell breaks uniqueness
    }
  }

  const givenMask = puzzle.map((v) => v !== 0)

  return { puzzle, solution, givenMask, difficulty }
}
