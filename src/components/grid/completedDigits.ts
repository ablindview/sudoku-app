import { ALL_DIGITS, type Digit } from '../../engine/types'
import type { GameState } from '../../game/gameTypes'

/**
 * A digit counts as "complete" once all 9 of its solution cells have been
 * correctly filled in — not merely "9 cells currently show this digit"
 * (which could include a wrong/conflicting placement elsewhere while the
 * digit's own solution cells are still short one). Checking against
 * state.solution directly avoids that edge case entirely.
 */
export function computeCompletedDigits(state: GameState): Set<Digit> {
  const correctCounts = new Map<Digit, number>()

  for (let i = 0; i < state.solution.length; i++) {
    const solutionValue = state.solution[i] as Digit
    if (state.values[i] === solutionValue) {
      correctCounts.set(solutionValue, (correctCounts.get(solutionValue) ?? 0) + 1)
    }
  }

  const completed = new Set<Digit>()
  for (const digit of ALL_DIGITS) {
    if (correctCounts.get(digit) === 9) completed.add(digit)
  }
  return completed
}
