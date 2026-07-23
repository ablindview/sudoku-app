import { useEffect, useRef, type KeyboardEvent } from 'react'
import { toIndex } from '../../engine/board'
import { useAnnouncer } from '../../a11y/useAnnouncer'
import { useGameDispatch, useGameState } from '../../game/useGame'
import { useSettings } from '../../settings/useSettings'
import { CellVisual } from './CellVisual'
import { buildCellState, gridCellLabel } from './cellLabel'
import { buildCellInlineStyle } from './cellStyle'
import { computeNextIndex, isClearKey, NAV_KEYS, parseDigitKey } from './gridKeyboard'

const ROWS = Array.from({ length: 9 }, (_, i) => i)
const COLS = Array.from({ length: 9 }, (_, i) => i)

export function GridA11yGrid() {
  const state = useGameState()
  const dispatch = useGameDispatch()
  const announce = useAnnouncer()
  const { settings } = useSettings()
  const cellRefs = useRef<(HTMLDivElement | null)[]>([])

  const selectedIndex = state.selectedIndex ?? 0
  const previousSelectedIndex = useRef<number | null>(null)

  // Move DOM focus to match selectedIndex after keyboard nav or a click, but
  // don't steal focus on initial mount just because a cell is selected.
  // Tracking the previous value (rather than a fire-once flag) keeps this
  // idempotent under React StrictMode's dev-mode double effect invocation.
  useEffect(() => {
    if (previousSelectedIndex.current !== null && previousSelectedIndex.current !== selectedIndex) {
      cellRefs.current[selectedIndex]?.focus()
    }
    previousSelectedIndex.current = selectedIndex
  }, [selectedIndex])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>, index: number) {
    // Never hijack browser/OS shortcuts (Cmd/Ctrl+0 zoom reset, Cmd/Ctrl+1-9
    // tab switching, Cmd/Ctrl+N new window, etc.) — only plain key presses
    // are game input.
    if (event.ctrlKey || event.metaKey || event.altKey) return

    if (NAV_KEYS.has(event.key)) {
      const next = computeNextIndex(index, event)
      if (next !== null) {
        event.preventDefault()
        dispatch({ type: 'SELECT_CELL', index: next })
      }
      return
    }

    // Notes-mode is a global toggle, not a per-cell edit, so it must work
    // regardless of whether the focused cell happens to be given.
    if (event.key === 'n' || event.key === 'N') {
      event.preventDefault()
      announce(state.notesMode ? 'Notes mode off' : 'Notes mode on')
      dispatch({ type: 'TOGGLE_NOTES_MODE' })
      return
    }

    if (state.givenMask[index]) return // given cells: navigation only, no edits

    const digit = parseDigitKey(event.key)
    if (digit !== null) {
      event.preventDefault()
      dispatch(state.notesMode ? { type: 'TOGGLE_NOTE', index, digit } : { type: 'SET_VALUE', index, value: digit })
      return
    }

    if (isClearKey(event.key)) {
      event.preventDefault()
      dispatch({ type: 'CLEAR_CELL', index })
    }
  }

  // The digit of whichever cell is selected — every other cell sharing it
  // gets a highlight ring, so selecting a placed number (click, tap, or
  // keyboard nav) highlights all its other instances across the board.
  const highlightedValue = state.selectedIndex !== null ? state.values[state.selectedIndex] : 0

  return (
    <div className="sudoku-grid" role="grid" aria-label="Sudoku puzzle, 9 by 9" aria-rowcount={9} aria-colcount={9}>
      {ROWS.map((row) => (
        <div key={row} role="row" aria-rowindex={row + 1} style={{ display: 'contents' }}>
          {COLS.map((col) => {
            const index = toIndex(row, col)
            const cell = buildCellState(state, index, settings.autoCheckConflicts, highlightedValue)

            const classNames = ['sudoku-cell']
            if (cell.isGiven) classNames.push('sudoku-cell--given')
            else if (cell.isHinted) classNames.push('sudoku-cell--hinted')
            else if (cell.value !== 0) classNames.push('sudoku-cell--player')
            if (cell.hasConflict) classNames.push('sudoku-cell--conflict')

            return (
              <div
                key={index}
                ref={(el) => {
                  cellRefs.current[index] = el
                }}
                role="gridcell"
                aria-colindex={col + 1}
                aria-selected={cell.isSelected}
                aria-label={gridCellLabel(cell)}
                tabIndex={index === selectedIndex ? 0 : -1}
                data-row={row}
                data-col={col}
                className={classNames.join(' ')}
                style={buildCellInlineStyle(cell, row, col)}
                onClick={() => dispatch({ type: 'SELECT_CELL', index })}
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                <CellVisual cell={cell} />
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
