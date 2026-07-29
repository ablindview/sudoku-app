import { useMemo, type CSSProperties } from 'react'
import { useAnnouncer } from '../../a11y/useAnnouncer'
import { ALL_DIGITS } from '../../engine/types'
import { useGameDispatch, useGameState } from '../../game/useGame'
import { computeCompletedDigits } from './completedDigits'

/**
 * A persistent, tap-only digit entry row below the grid — added so touch
 * users never have to rely on a device's native on-screen keyboard (Mode B's
 * real <input> elements set inputMode="none" specifically to suppress it;
 * see GridInputTable.tsx). Each digit button reuses the exact same
 * --digit-bg/--digit-ink pairing a filled cell gets in cellStyle.ts, so the
 * number-to-color association a player builds up from the grid itself
 * carries straight over to this pad instead of introducing a second,
 * unrelated palette to learn.
 *
 * Once a digit is complete (all 9 solution cells correctly filled — see
 * completedDigits.ts), its button switches to a dedicated black
 * background/red text pair instead — requested explicitly, distinct from
 * the grid's own plain-surface/red treatment for the same state (see
 * cellStyle.ts) since a pad button has no "empty cell" surface to fall
 * back to. The two contrast themes no-op this (see theme.css) and rely on
 * the underline below instead, same principle as the grid's own
 * .sudoku-cell--complete.
 *
 * Disabling: the whole pad goes `inert` for free while paused, since it's
 * rendered inside the same aria-hidden/inert wrapper as the grid in
 * SudokuGrid.tsx. The "no cell selected" / "selected cell is a given" cases
 * deliberately do NOT use the `disabled` attribute — this pad is the primary
 * replacement for the native keyboard, not a secondary action, and a real
 * game starts with `selectedIndex: null`, so disabling on that condition
 * would pull every button out of the tab order on first load, before a
 * keyboard user has any way to discover the pad exists. Mirrors
 * Toolbar.tsx's handleHint instead: stay focusable and enabled, announce
 * guidance on click when there's nothing valid to act on.
 */
export function NumberPad() {
  const state = useGameState()
  const dispatch = useGameDispatch()
  const announce = useAnnouncer()
  const completedDigits = useMemo(() => computeCompletedDigits(state), [state])

  const index = state.selectedIndex
  const canEdit = index !== null && !state.givenMask[index]

  function handleDigit(digit: (typeof ALL_DIGITS)[number]) {
    if (index === null || !canEdit) {
      announce('Select an empty cell to enter a number', 'assertive')
      return
    }
    dispatch(state.notesMode ? { type: 'TOGGLE_NOTE', index, digit } : { type: 'SET_VALUE', index, value: digit })
  }

  function handleClear() {
    if (index === null || !canEdit) {
      announce('Select an empty cell to enter a number', 'assertive')
      return
    }
    dispatch({ type: 'CLEAR_CELL', index })
  }

  return (
    <fieldset className="number-pad">
      <legend className="visually-hidden">Number pad</legend>
      {ALL_DIGITS.map((digit) => {
        const isComplete = completedDigits.has(digit)
        return (
          <button
            key={digit}
            type="button"
            className={isComplete ? 'number-pad-button number-pad-button--complete' : 'number-pad-button'}
            style={
              isComplete
                ? ({
                    '--digit-bg': 'var(--color-complete-pad-bg)',
                    '--digit-ink': 'var(--color-complete-pad-text)',
                  } as CSSProperties)
                : ({
                    '--digit-bg': `var(--identity-${digit})`,
                    '--digit-ink': `var(--color-digit-text, var(--identity-${digit}-ink))`,
                  } as CSSProperties)
            }
            aria-label={isComplete ? `${digit}, digit complete` : undefined}
            onClick={() => handleDigit(digit)}
          >
            {digit}
          </button>
        )
      })}
      <button type="button" className="number-pad-button number-pad-clear" onClick={handleClear}>
        Clear
      </button>
    </fieldset>
  )
}
