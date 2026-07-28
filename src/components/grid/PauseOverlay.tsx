import { useEffect, useRef } from 'react'
import { useAnnouncer } from '../../a11y/useAnnouncer'
import { useGameDispatch } from '../../game/useGame'

/**
 * Renders as an opaque sibling on top of the grid (see SudokuGrid.tsx) while
 * paused — the grid underneath is also `aria-hidden` at that point, so a
 * screen-reader user gets the same "the puzzle is hidden right now" result
 * as a sighted one, not just a visual trick they could still read past.
 */
export function PauseOverlay() {
  const dispatch = useGameDispatch()
  const announce = useAnnouncer()
  const resumeButtonRef = useRef<HTMLButtonElement>(null)

  // Move focus onto the overlay's own control as soon as it appears — the
  // cell that had focus a moment ago is now hidden underneath, and leaving
  // focus stranded there would let a keyboard user "type" into an invisible,
  // frozen grid with no feedback.
  useEffect(() => {
    resumeButtonRef.current?.focus()
  }, [])

  function handleResume() {
    dispatch({ type: 'RESUME' })
    announce('Puzzle resumed')
  }

  return (
    <div className="pause-overlay">
      <p className="pause-overlay-text">Paused</p>
      <button ref={resumeButtonRef} type="button" onClick={handleResume}>
        Resume
      </button>
    </div>
  )
}
