export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type CellValue = 0 | Digit // 0 = empty
export type Board = CellValue[] // length 81, row-major: index = row * 9 + col

export type Difficulty = 'easy' | 'medium' | 'hard'

export const ALL_DIGITS: readonly Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]
