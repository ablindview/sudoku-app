import { ALL_DIGITS, type Board, type Digit } from './types'
import { CELL_COUNT, cloneBoard, peersOf, rowIndices, colIndices, boxIndices, SIZE } from './board'

const FULL_MASK = 0b1111111110 // bits 1-9 set

const bitFor = (digit: Digit): number => 1 << digit

const digitsFromMask = (mask: number): Digit[] => {
  const digits: Digit[] = []
  for (const d of ALL_DIGITS) {
    if (mask & bitFor(d)) digits.push(d)
  }
  return digits
}

/** Bitmask (bits 1-9) of digits NOT currently used by any peer of `index`. */
const candidateMask = (board: Board, index: number): number => {
  let used = 0
  for (const peer of peersOf[index]) {
    const v = board[peer]
    if (v !== 0) used |= bitFor(v as Digit)
  }
  return FULL_MASK & ~used
}

export function isValidPlacement(board: Board, index: number, value: Digit): boolean {
  for (const peer of peersOf[index]) {
    if (board[peer] === value) return false
  }
  return true
}

/**
 * Backtracking solve using MRV (minimum remaining values): always branch on the
 * empty cell with the fewest candidates first, which prunes far more aggressively
 * than a fixed cell order.
 */
export function solve(board: Board): Board | null {
  // A board whose givens already violate row/col/box uniqueness has zero
  // solutions. Without this check, deterministic MRV backtracking can spend a
  // very long time exploring a search space that a same-value conflict makes
  // dead from the start (the conflicting pair never gets revisited once placed).
  if (getConflicts(board).size > 0) return null

  const working = cloneBoard(board)
  return backtrack(working) ? working : null
}

function backtrack(board: Board): boolean {
  const next = findMRVCell(board)
  if (next === null) return true // no empty cells left: solved

  const { index, mask } = next
  if (mask === 0) return false // dead end: empty cell with no candidates

  for (const digit of digitsFromMask(mask)) {
    board[index] = digit
    if (backtrack(board)) return true
    board[index] = 0
  }
  return false
}

function findMRVCell(board: Board): { index: number; mask: number } | null {
  let best: { index: number; mask: number } | null = null
  let bestCount = Infinity

  for (let index = 0; index < CELL_COUNT; index++) {
    if (board[index] !== 0) continue
    const mask = candidateMask(board, index)
    const count = popcount(mask)
    if (count < bestCount) {
      best = { index, mask }
      bestCount = count
      if (count === 0) return best // can't get more constrained than "no candidates"
    }
  }
  return best
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
 * Counts solutions up to `limit` (default 2), stopping early once the limit is
 * reached. Used to check uniqueness without paying for a full solution count.
 */
export function countSolutions(board: Board, limit = 2): number {
  if (getConflicts(board).size > 0) return 0

  const working = cloneBoard(board)
  let count = 0

  function search(): boolean {
    const next = findMRVCell(working)
    if (next === null) {
      count++
      return count >= limit // stop searching once we've hit the limit
    }
    const { index, mask } = next
    if (mask === 0) return false

    for (const digit of digitsFromMask(mask)) {
      working[index] = digit
      if (search()) {
        working[index] = 0
        return true
      }
      working[index] = 0
    }
    return false
  }

  search()
  return count
}

export function hasUniqueSolution(board: Board): boolean {
  return countSolutions(board, 2) === 1
}

/** Pure rule check: row/column/box duplicate digits. Never consults a solution. */
export function getConflicts(board: Board): Set<number> {
  const conflicts = new Set<number>()

  const checkGroup = (indices: number[]) => {
    const seen = new Map<number, number>() // digit -> first index seen
    for (const idx of indices) {
      const v = board[idx]
      if (v === 0) continue
      const firstIdx = seen.get(v)
      if (firstIdx !== undefined) {
        conflicts.add(firstIdx)
        conflicts.add(idx)
      } else {
        seen.set(v, idx)
      }
    }
  }

  for (let row = 0; row < SIZE; row++) checkGroup(rowIndices(row))
  for (let col = 0; col < SIZE; col++) checkGroup(colIndices(col))
  for (let box = 0; box < SIZE; box++) checkGroup(boxIndices(box))

  return conflicts
}

export function getCandidates(board: Board, index: number): Set<Digit> {
  if (board[index] !== 0) return new Set()
  return new Set(digitsFromMask(candidateMask(board, index)))
}
