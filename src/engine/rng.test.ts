import { describe, expect, it } from 'vitest'
import { createRng, shuffle, shuffledDigits } from './rng'

describe('createRng', () => {
  it('is deterministic for a given seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    const seqA = Array.from({ length: 10 }, () => a())
    const seqB = Array.from({ length: 10 }, () => b())
    expect(seqA).toEqual(seqB)
  })

  it('produces values in [0, 1)', () => {
    const rng = createRng(1)
    for (let i = 0; i < 100; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('produces different sequences for different seeds', () => {
    const a = createRng(1)()
    const b = createRng(2)()
    expect(a).not.toBe(b)
  })
})

describe('shuffle', () => {
  it('preserves all elements (a permutation, not a resample)', () => {
    const rng = createRng(7)
    const input = [1, 2, 3, 4, 5]
    const result = shuffle(input, rng)
    expect(result.slice().sort()).toEqual(input.slice().sort())
  })

  it('does not mutate the input array', () => {
    const rng = createRng(7)
    const input = [1, 2, 3]
    const copy = input.slice()
    shuffle(input, rng)
    expect(input).toEqual(copy)
  })
})

describe('shuffledDigits', () => {
  it('returns a permutation of 1-9', () => {
    const digits = shuffledDigits(createRng(3))
    expect(digits.slice().sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})
