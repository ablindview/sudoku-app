import { useEffect, useId, useRef, useState } from 'react'
import { toRowCol } from '../../engine/board'
import type { Difficulty } from '../../engine/types'
import { useAnnouncer } from '../../a11y/useAnnouncer'
import { useGameDispatch, useGameState, useNewGame } from '../../game/useGame'

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export function Toolbar() {
  const state = useGameState()
  const dispatch = useGameDispatch()
  const newGame = useNewGame()
  const announce = useAnnouncer()
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty>(state.difficulty)
  const difficultyId = useId()
  const newGameButtonRef = useRef<HTMLButtonElement>(null)
  const previousStatus = useRef(state.status)

  const gameplayDisabled = state.status !== 'playing'

  // Keep the "next game" select in sync with whatever game is actually
  // running (it only diverges once the player changes it, ahead of clicking
  // New Game) — otherwise it disagrees with StatusBar's "Difficulty: X" from
  // the very first load, since the app auto-starts a game before the player
  // ever touches this control.
  useEffect(() => {
    setPendingDifficulty(state.difficulty)
  }, [state.difficulty])

  // A focused button that becomes `disabled` is blurred by the browser with
  // no visible indicator (focus silently falls to <body>). That happens here
  // whenever Hint completes the puzzle while it holds focus, right as the
  // "solved" announcement fires — send focus somewhere useful instead of
  // leaving the keyboard user stranded.
  useEffect(() => {
    if (state.status === 'solved' && previousStatus.current !== 'solved') {
      newGameButtonRef.current?.focus()
    }
    previousStatus.current = state.status
  }, [state.status])

  function handleNewGame() {
    newGame(pendingDifficulty)
    announce(`New game started, ${DIFFICULTY_LABELS[pendingDifficulty]} difficulty`)
  }

  function handleToggleNotes() {
    announce(state.notesMode ? 'Notes mode off' : 'Notes mode on')
    dispatch({ type: 'TOGGLE_NOTES_MODE' })
  }

  function handleHint() {
    const index = state.selectedIndex
    if (index === null || state.givenMask[index]) {
      announce('Select an empty cell to get a hint', 'assertive')
      return
    }
    if (state.values[index] === state.solution[index]) {
      announce('This cell is already correct', 'assertive')
      return
    }
    const { row, col } = toRowCol(index)
    const digit = state.solution[index]
    dispatch({ type: 'APPLY_HINT', index })
    announce(`Hint: row ${row + 1}, column ${col + 1} is ${digit}`, 'assertive')
  }

  function handleCheckBoard() {
    const count = state.conflicts.size
    announce(
      count === 0 ? 'No conflicts found' : `${count} conflicting cell${count === 1 ? '' : 's'} found`,
      'assertive',
    )
  }

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <label htmlFor={difficultyId}>New game difficulty</label>
        <select
          id={difficultyId}
          value={pendingDifficulty}
          onChange={(event) => setPendingDifficulty(event.target.value as Difficulty)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <button ref={newGameButtonRef} type="button" onClick={handleNewGame}>
          New Game
        </button>
      </div>
      <div className="toolbar-group">
        <button type="button" aria-pressed={state.notesMode} onClick={handleToggleNotes} disabled={gameplayDisabled}>
          Notes
        </button>
        <button type="button" onClick={handleHint} disabled={gameplayDisabled}>
          Hint
        </button>
        <button type="button" onClick={handleCheckBoard} disabled={gameplayDisabled}>
          Check Board
        </button>
      </div>
    </div>
  )
}
