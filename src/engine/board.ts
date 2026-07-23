import type { Board, CellValue } from './types'

export const SIZE = 9
export const BOX_SIZE = 3
export const CELL_COUNT = SIZE * SIZE

export const toIndex = (row: number, col: number): number => row * SIZE + col

export const toRowCol = (index: number): { row: number; col: number } => ({
  row: Math.floor(index / SIZE),
  col: index % SIZE,
})

export const boxOf = (row: number, col: number): number =>
  Math.floor(row / BOX_SIZE) * BOX_SIZE + Math.floor(col / BOX_SIZE)

export const createEmptyBoard = (): Board => new Array(CELL_COUNT).fill(0) as Board

export const cloneBoard = (board: Board): Board => board.slice()

/** peersOf[index] = the other 20 cell indices sharing a row, column, or box with `index`. */
export const peersOf: readonly number[][] = Array.from({ length: CELL_COUNT }, (_, index) => {
  const { row, col } = toRowCol(index)
  const box = boxOf(row, col)
  const boxRow = Math.floor(box / BOX_SIZE) * BOX_SIZE
  const boxCol = (box % BOX_SIZE) * BOX_SIZE

  const peers = new Set<number>()
  for (let c = 0; c < SIZE; c++) peers.add(toIndex(row, c))
  for (let r = 0; r < SIZE; r++) peers.add(toIndex(r, col))
  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) peers.add(toIndex(r, c))
  }
  peers.delete(index)
  return Array.from(peers)
})

export const rowIndices = (row: number): number[] =>
  Array.from({ length: SIZE }, (_, col) => toIndex(row, col))

export const colIndices = (col: number): number[] =>
  Array.from({ length: SIZE }, (_, row) => toIndex(row, col))

export const boxIndices = (box: number): number[] => {
  const boxRow = Math.floor(box / BOX_SIZE) * BOX_SIZE
  const boxCol = (box % BOX_SIZE) * BOX_SIZE
  const indices: number[] = []
  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) indices.push(toIndex(r, c))
  }
  return indices
}

export const countGivens = (board: Board): number =>
  board.reduce((count: number, v: CellValue) => count + (v !== 0 ? 1 : 0), 0)
