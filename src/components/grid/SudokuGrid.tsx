import { useGameState } from '../../game/useGame'
import { useSettings } from '../../settings/useSettings'
import { GridA11yGrid } from './GridA11yGrid'
import { GridInputTable } from './GridInputTable'
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

  return settings.gridMode === 'inputTable' ? <GridInputTable /> : <GridA11yGrid />
}
