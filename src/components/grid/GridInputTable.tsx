import { useEffect, useMemo, useRef, type ChangeEvent, type KeyboardEvent } from 'react'
import { boxOf, toIndex, toRowCol } from '../../engine/board'
import { useAnnouncer } from '../../a11y/useAnnouncer'
import { useGameDispatch, useGameState } from '../../game/useGame'
import { useSettings } from '../../settings/useSettings'
import { NotesGrid } from './CellVisual'
import { buildCellState, inputCellLabel } from './cellLabel'
import { buildCellInlineStyle } from './cellStyle'
import { computeCompletedDigits } from './completedDigits'
import { computeNextIndex, NAV_KEYS, parseDigitKey } from './gridKeyboard'

const ROWS = Array.from({ length: 9 }, (_, i) => i)
const COLS = Array.from({ length: 9 }, (_, i) => i)

/**
 * Mode B: 81 individual <input> cells in a <table>, native Tab order as the
 * primary navigation model (arrow keys are an additive enhancement, not a
 * replacement). Shares the same game state/actions as GridA11yGrid — only
 * the markup shape and focus/keyboard wiring differ.
 */
export function GridInputTable() {
  const state = useGameState()
  const dispatch = useGameDispatch()
  const announce = useAnnouncer()
  const { settings } = useSettings()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const previousStatus = useRef(state.status)

  // Resuming from pause unmounts PauseOverlay's own (auto-focused) Resume
  // button — the browser drops focus to <body> with no built-in recovery.
  // Restore it to the cell the player had selected rather than stranding
  // keyboard/SR users at the top of the page (mirrors GridA11yGrid's fix).
  useEffect(() => {
    if (previousStatus.current === 'paused' && state.status === 'playing') {
      const index = state.selectedIndex ?? 0
      inputRefs.current[index]?.focus()
    }
    previousStatus.current = state.status
  }, [state.status, state.selectedIndex])

  function handleChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value

    if (raw === '') {
      dispatch({ type: 'CLEAR_CELL', index })
      return
    }

    // maxLength=1 keeps this to a single character in the common case; take
    // the last character regardless as a guard against a transient
    // multi-character value some IME/mobile keyboard paths could produce.
    const lastChar = raw[raw.length - 1]

    if (lastChar === '0') {
      dispatch({ type: 'CLEAR_CELL', index }) // '0' clears, mirroring Mode A's isClearKey
      return
    }

    const digit = parseDigitKey(lastChar)
    if (digit === null) {
      // Reject without dispatching. A controlled input's DOM value is only
      // overwritten when React re-renders it with a new prop — if we just
      // returned here, the invalid character the browser already inserted
      // would stay stuck in the DOM, diverged from state, until some
      // unrelated re-render (e.g. the once-a-second timer tick) papered
      // over it. Reset it explicitly instead of relying on that.
      event.target.value = state.values[index] !== 0 ? String(state.values[index]) : ''
      return
    }

    dispatch(state.notesMode ? { type: 'TOGGLE_NOTE', index, digit } : { type: 'SET_VALUE', index, value: digit })
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.ctrlKey || event.metaKey || event.altKey) return // never hijack browser/OS shortcuts

    // Notes-mode is a global toggle, not a per-cell edit, so it works
    // regardless of whether the focused cell happens to be given.
    if (event.key === 'n' || event.key === 'N') {
      event.preventDefault()
      announce(state.notesMode ? 'Notes mode off' : 'Notes mode on')
      dispatch({ type: 'TOGGLE_NOTES_MODE' })
      return
    }

    if (NAV_KEYS.has(event.key)) {
      const next = computeNextIndex(index, event)
      if (next !== null) {
        event.preventDefault()
        inputRefs.current[next]?.focus() // triggers onFocus below, which keeps selectedIndex in sync
      }
    }
  }

  // The digit of whichever cell is selected — every other cell sharing it
  // gets a highlight ring, so selecting a placed number (click, tap, or
  // keyboard nav) highlights all its other instances across the board.
  const highlightedValue = state.selectedIndex !== null ? state.values[state.selectedIndex] : 0
  const selectedRow = state.selectedIndex !== null ? toRowCol(state.selectedIndex).row : null
  const selectedCol = state.selectedIndex !== null ? toRowCol(state.selectedIndex).col : null
  const focusedBox = selectedRow !== null && selectedCol !== null ? boxOf(selectedRow, selectedCol) : null
  const completedDigits = useMemo(() => computeCompletedDigits(state), [state])

  return (
    <table className="sudoku-input-grid">
      <caption className="visually-hidden">
        Sudoku puzzle. Tab through cells in reading order, or use arrow keys once a cell has focus. Type a digit 1-9
        to fill a cell, or select a cell and use the number pad below the grid; clear a cell with Backspace, Delete,
        or the number pad&apos;s Clear button.
      </caption>
      <tbody>
        {ROWS.map((row) => (
          <tr key={row}>
            {COLS.map((col) => {
              const index = toIndex(row, col)
              const cell = buildCellState(state, index, settings.autoCheckConflicts, highlightedValue, completedDigits)

              const classNames = ['sudoku-input-cell']
              if (cell.isGiven) classNames.push('sudoku-cell--given')
              else if (cell.isHinted) classNames.push('sudoku-cell--hinted')
              else if (cell.value !== 0) classNames.push('sudoku-cell--player')
              if (cell.hasConflict) classNames.push('sudoku-cell--conflict')
              if (cell.isDigitComplete) classNames.push('sudoku-cell--complete')

              return (
                <td
                  key={index}
                  data-row={row}
                  data-col={col}
                  className={classNames.join(' ')}
                  style={buildCellInlineStyle(cell, row, col, selectedRow, selectedCol, 'var(--color-border)', focusedBox)}
                >
                  <input
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    // "none" tells mobile browsers not to pop up their own
                    // on-screen keyboard — the NumberPad below the grid is
                    // the intended tap target instead (requested explicitly:
                    // the native keyboard was getting in the way). The input
                    // stays a real, focusable, editable text field otherwise
                    // — this only suppresses the IME/virtual-keyboard UI, it
                    // doesn't block a physical keyboard or screen reader.
                    inputMode="none"
                    maxLength={1}
                    className="sudoku-input"
                    value={cell.value !== 0 ? String(cell.value) : ''}
                    readOnly={cell.isGiven}
                    aria-label={inputCellLabel(cell)}
                    onFocus={() => dispatch({ type: 'SELECT_CELL', index })}
                    onChange={(event) => handleChange(index, event)}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                  />
                  {cell.value === 0 && <NotesGrid notesDigits={cell.notesDigits} />}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
