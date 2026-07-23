import { useEffect, useRef } from 'react'
import type { Difficulty } from '../../engine/types'
import { useAnnouncer } from '../../a11y/useAnnouncer'
import { useGameState } from '../../game/useGame'

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function StatusBar() {
  const state = useGameState()
  const announce = useAnnouncer()
  const previousStatus = useRef(state.status)

  // Announced once, on the transition into 'solved' — the timer/status text
  // below is intentionally NOT a live region, since re-announcing every
  // second as the clock ticks would be unusable with a screen reader.
  useEffect(() => {
    if (state.status === 'solved' && previousStatus.current !== 'solved') {
      announce(
        `Puzzle solved! ${DIFFICULTY_LABELS[state.difficulty]} difficulty in ${formatTime(state.elapsedSeconds)}`,
        'assertive',
      )
    }
    previousStatus.current = state.status
  }, [state.status, state.difficulty, state.elapsedSeconds, announce])

  if (state.status === 'idle') return null

  return (
    <div className="status-bar">
      <span>Difficulty: {DIFFICULTY_LABELS[state.difficulty]}</span>
      <span>Time: {formatTime(state.elapsedSeconds)}</span>
      <span>Hints used: {state.hintsUsed}</span>
      {state.status === 'solved' && <span className="status-bar-solved">Solved!</span>}
    </div>
  )
}
