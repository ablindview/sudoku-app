import type { Digit } from '../../engine/types'
import type { CellDisplayState } from './cellLabel'

const ALL_DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

/** The 3x3 pencil-mark mini-grid, shared by both grid modes. aria-hidden
 * since the accessible name comes entirely from the cell's aria-label (see
 * cellLabel.ts) — this is decoration only, never a second source of truth. */
export function NotesGrid({ notesDigits }: { notesDigits: Digit[] }) {
  if (notesDigits.length === 0) return null

  return (
    <span className="sudoku-cell-notes" aria-hidden="true">
      {ALL_DIGITS.map((digit) => (
        <span key={digit}>{notesDigits.includes(digit) ? digit : ''}</span>
      ))}
    </span>
  )
}

/** Mode A's cell content: a big digit, or the notes mini-grid, or nothing.
 * Mode B doesn't use this directly — its own <input> already shows the
 * value, so it renders <NotesGrid> on its own only when the cell is empty. */
export function CellVisual({ cell }: { cell: CellDisplayState }) {
  if (cell.value !== 0) {
    return <span aria-hidden="true">{cell.value}</span>
  }

  return <NotesGrid notesDigits={cell.notesDigits} />
}
