import { createContext } from 'react'

export type AnnouncePriority = 'polite' | 'assertive'
export type Announce = (message: string, priority?: AnnouncePriority) => void

export const AnnouncerContext = createContext<Announce | null>(null)

export interface AnnouncerMessages {
  politeMessage: string
  assertiveMessage: string
}

// Exposes the current live-region text (not just the announce() function) so
// content that renders inside a native <dialog> can mirror it: everything
// outside an open modal <dialog> becomes `inert` (hidden from the
// accessibility tree), which would otherwise silently swallow any
// announcement queued right as the dialog opens.
export const AnnouncerMessagesContext = createContext<AnnouncerMessages | null>(null)
