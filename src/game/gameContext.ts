import { createContext } from 'react'
import type { Difficulty } from '../engine/types'
import type { GameAction, GameState } from './gameTypes'

// Split state/dispatch into separate contexts so components that only dispatch
// (toolbar buttons) don't re-render on every state change.
export const GameStateContext = createContext<GameState | null>(null)
export const GameDispatchContext = createContext<((action: GameAction) => void) | null>(null)
export const NewGameContext = createContext<((difficulty: Difficulty) => void) | null>(null)
