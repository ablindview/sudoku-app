import { useContext } from 'react'
import { GameDispatchContext, GameStateContext, NewGameContext } from './gameContext'

export function useGameState() {
  const state = useContext(GameStateContext)
  if (!state) throw new Error('useGameState must be used within a GameProvider')
  return state
}

export function useGameDispatch() {
  const dispatch = useContext(GameDispatchContext)
  if (!dispatch) throw new Error('useGameDispatch must be used within a GameProvider')
  return dispatch
}

export function useNewGame() {
  const newGame = useContext(NewGameContext)
  if (!newGame) throw new Error('useNewGame must be used within a GameProvider')
  return newGame
}
