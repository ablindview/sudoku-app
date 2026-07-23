import { boxOf, toRowCol } from '../../engine/board'
import type { CellValue, Digit } from '../../engine/types'
import { digitsInNotesMask, type GameState } from '../../game/gameTypes'

export interface CellDisplayState {
  index: number
  row: number
  col: number
  box: number
  value: CellValue
  notesDigits: Digit[]
  isGiven: boolean
  isHinted: boolean
  hasConflict: boolean
  isSelected: boolean
  isDigitHighlighted: boolean
}

/**
 * `revealConflicts` mirrors settings.autoCheckConflicts: when false, rule
 * violations stay tracked internally (for the "Check board" count) but are
 * not surfaced on individual cells until the player explicitly asks.
 *
 * `highlightedValue` is the value of the currently selected cell (0 if empty
 * or nothing selected). Any other filled cell sharing that value is flagged
 * isDigitHighlighted — selecting a cell (by click, tap, or keyboard nav)
 * highlights every other instance of its digit across the board.
 */
export function buildCellState(
  state: GameState,
  index: number,
  revealConflicts = true,
  highlightedValue: CellValue = 0,
): CellDisplayState {
  const { row, col } = toRowCol(index)
  const value = state.values[index]
  return {
    index,
    row,
    col,
    box: boxOf(row, col),
    value,
    notesDigits: digitsInNotesMask(state.notes[index]),
    isGiven: state.givenMask[index],
    isHinted: state.hintedCells.has(index),
    hasConflict: revealConflicts && state.conflicts.has(index),
    isSelected: state.selectedIndex === index,
    isDigitHighlighted: highlightedValue !== 0 && value === highlightedValue,
  }
}

function stateSuffix(cell: CellDisplayState): string {
  if (cell.isGiven) return ', given'
  if (cell.hasConflict) return ', conflict'
  if (cell.isHinted) return ', hint'
  if (cell.value === 0 && cell.notesDigits.length > 0) return `, notes ${cell.notesDigits.join(', ')}`
  return ''
}

/** Mode A: the cell is a div with no native "value", so the label must carry
 * position, value, and state all together. */
export function gridCellLabel(cell: CellDisplayState): string {
  const pos = `Row ${cell.row + 1}, column ${cell.col + 1}`
  const val = cell.value !== 0 ? `, value ${cell.value}` : ', empty'
  return `${pos}${val}${stateSuffix(cell)}`
}

/** Mode B: the cell is a real input whose value is announced natively, so the
 * label omits the digit to avoid a double announcement. */
export function inputCellLabel(cell: CellDisplayState): string {
  const pos = `Row ${cell.row + 1}, column ${cell.col + 1}`
  return `${pos}${stateSuffix(cell)}`
}
