import { describe, expect, it } from 'vitest'
import { DIFFICULTY_CONFIGS, generatePuzzle, generateSolvedBoard } from './generator'
import { createRng } from './rng'
import { countGivens, colIndices, boxIndices, rowIndices } from './board'
import { hasUniqueSolution, solve } from './solver'
import type { Difficulty } from './types'

const isPermutationOf1to9 = (values: number[]) => values.slice().sort((a, b) => a - b).every((v, i) => v === i + 1)

describe('generateSolvedBoard', () => {
  it('produces a fully valid grid across many seeds', () => {
    for (let seed = 0; seed < 20; seed++) {
      const board = generateSolvedBoard(createRng(seed))
      expect(board).toHaveLength(81)
      expect(board.every((v) => v !== 0)).toBe(true)

      for (let row = 0; row < 9; row++) {
        expect(isPermutationOf1to9(rowIndices(row).map((i) => board[i]))).toBe(true)
      }
      for (let col = 0; col < 9; col++) {
        expect(isPermutationOf1to9(colIndices(col).map((i) => board[i]))).toBe(true)
      }
      for (let box = 0; box < 9; box++) {
        expect(isPermutationOf1to9(boxIndices(box).map((i) => board[i]))).toBe(true)
      }
    }
  })

  it('produces different boards for different seeds', () => {
    const a = generateSolvedBoard(createRng(1))
    const b = generateSolvedBoard(createRng(2))
    expect(a).not.toEqual(b)
  })
})

describe('generatePuzzle', () => {
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard']

  for (const difficulty of difficulties) {
    it(`generates a unique-solution ${difficulty} puzzle within the configured given-count range`, () => {
      const { puzzle, solution, givenMask } = generatePuzzle(difficulty, createRng(123))
      const config = DIFFICULTY_CONFIGS[difficulty]
      const givens = countGivens(puzzle)

      expect(givens).toBeGreaterThanOrEqual(config.minGivens)
      expect(givens).toBeLessThanOrEqual(config.maxGivens)
      expect(hasUniqueSolution(puzzle)).toBe(true)
      expect(solve(puzzle)).toEqual(solution)

      // givenMask matches which cells are actually filled in the puzzle
      for (let i = 0; i < 81; i++) {
        expect(givenMask[i]).toBe(puzzle[i] !== 0)
      }
    })
  }

  it('every given cell in the puzzle matches the solution', () => {
    const { puzzle, solution } = generatePuzzle('medium', createRng(9))
    for (let i = 0; i < 81; i++) {
      if (puzzle[i] !== 0) expect(puzzle[i]).toBe(solution[i])
    }
  })

  it('produces a different puzzle for a different seed', () => {
    const a = generatePuzzle('medium', createRng(1))
    const b = generatePuzzle('medium', createRng(2))
    expect(a.puzzle).not.toEqual(b.puzzle)
  })
})
