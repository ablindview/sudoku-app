import { useEffect, useRef } from 'react'
import { toRowCol } from '../../engine/board'
import { useAnnouncer } from '../../a11y/useAnnouncer'
import { useGameState } from '../../game/useGame'
import { useSettings } from '../../settings/useSettings'

/** Announces (assertive) when a NEW conflict appears at the currently
 * selected cell. Gated by both settings.autoCheckConflicts (if off, conflicts
 * aren't surfaced per-cell at all until "Check board" is pressed) and
 * settings.liveConflictAnnouncements (if autoCheckConflicts is on, this
 * further controls whether it also interrupts with speech vs. staying
 * available only in the cell label/visual). Shared by both grid modes via the
 * SudokuGrid router so the logic isn't duplicated. */
export function useConflictAnnouncements() {
  const state = useGameState()
  const { settings } = useSettings()
  const announce = useAnnouncer()
  const previousConflicts = useRef<Set<number>>(new Set())

  useEffect(() => {
    const newlyConflicting =
      state.selectedIndex !== null &&
      state.conflicts.has(state.selectedIndex) &&
      !previousConflicts.current.has(state.selectedIndex)

    if (
      newlyConflicting &&
      settings.autoCheckConflicts &&
      settings.liveConflictAnnouncements &&
      state.selectedIndex !== null
    ) {
      const { row, col } = toRowCol(state.selectedIndex)
      announce(`Conflict: row ${row + 1}, column ${col + 1}`, 'assertive')
    }

    previousConflicts.current = state.conflicts
  }, [state.conflicts, state.selectedIndex, settings.autoCheckConflicts, settings.liveConflictAnnouncements, announce])
}
