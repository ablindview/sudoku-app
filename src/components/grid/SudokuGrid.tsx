import { useGameState } from '../../game/useGame'
import { useSettings } from '../../settings/useSettings'
import { GridA11yGrid } from './GridA11yGrid'
import { GridInputTable } from './GridInputTable'
import { PauseOverlay } from './PauseOverlay'
import { useConflictAnnouncements } from './useConflictAnnouncements'

export function SudokuGrid() {
  const state = useGameState()
  const { settings } = useSettings()
  useConflictAnnouncements()

  // Puzzle generation is synchronous, real work (backtracking fill + a
  // uniqueness-check dig), so there's a genuine window after first paint
  // where state is still the empty idle placeholder. Rendering the grid
  // against that would read undefined values out of empty arrays and
  // announce bogus "value undefined" labels for all 81 cells.
  if (state.status === 'idle') {
    return (
      <p aria-live="polite" className="sudoku-grid-loading">
        Generating puzzle…
      </p>
    )
  }

  const isPaused = state.status === 'paused'

  return (
    <div className="sudoku-grid-wrapper">
      {/* Notes mode has no obvious visual cue beyond a subtle button tint
          (see base.css's [aria-pressed='true'] rule) — easy to leave on by
          accident (including via the shared 'n' keyboard shortcut) and not
          notice, at which point typing a digit silently adds a tiny pencil
          mark instead of filling the cell, which can look identical to
          "nothing happened." This banner makes that state impossible to miss. */}
      {state.notesMode && !isPaused && (
        <output className="notes-mode-banner">
          Notes mode is ON — typing a number adds a small pencil mark instead of filling the cell
        </output>
      )}
      {/* `inert` (not just aria-hidden) also removes the grid from the tab
          order and blocks pointer events while paused, so a keyboard user
          can't accidentally focus/type into cells that are visually covered
          by the overlay below. */}
      <div aria-hidden={isPaused} inert={isPaused || undefined}>
        {settings.gridMode === 'inputTable' ? <GridInputTable /> : <GridA11yGrid />}
      </div>
      {isPaused && <PauseOverlay />}
    </div>
  )
}
