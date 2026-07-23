import { useCallback, useEffect, useReducer, useRef, type ReactNode } from 'react'
import { generatePuzzle } from '../engine/generator'
import { createRng } from '../engine/rng'
import type { Difficulty } from '../engine/types'
import { GameDispatchContext, GameStateContext, NewGameContext } from './gameContext'
import { createIdleState, gameReducer } from './gameReducer'

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createIdleState)
  const hasStarted = useRef(false)

  // Randomness lives at this boundary, not in the reducer: generate a puzzle,
  // then dispatch the already-computed result as a plain LOAD_PUZZLE action.
  const newGame = useCallback((difficulty: Difficulty) => {
    const { puzzle, solution, givenMask } = generatePuzzle(difficulty, createRng(Date.now()))
    dispatch({ type: 'LOAD_PUZZLE', puzzle, solution, givenMask, difficulty })
  }, [])

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true
    newGame('medium')
  }, [newGame])

  useEffect(() => {
    if (state.status !== 'playing') return
    const id = window.setInterval(() => dispatch({ type: 'TICK' }), 1000)
    return () => window.clearInterval(id)
  }, [state.status])

  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        <NewGameContext.Provider value={newGame}>{children}</NewGameContext.Provider>
      </GameDispatchContext.Provider>
    </GameStateContext.Provider>
  )
}
