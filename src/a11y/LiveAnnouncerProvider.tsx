import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnnouncerContext, AnnouncerMessagesContext, type AnnouncePriority } from './announcerContext'
import { LiveRegionPair } from './LiveRegionPair'

// How long a set message stays up before the next queued one (if any) starts
// its own clear-then-set cycle. Long enough to give a screen reader time to
// actually speak a short sentence, not just have it briefly present in the DOM.
const HOLD_MS = 1500
const SET_DELAY_MS = 100

export function LiveAnnouncerProvider({ children }: { children: ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState('')
  const [assertiveMessage, setAssertiveMessage] = useState('')

  // Queue + in-flight timer per priority, so a second announce() call never
  // clobbers a message that hasn't been spoken yet — each gets its own turn.
  const politeQueue = useRef<string[]>([])
  const assertiveQueue = useRef<string[]>([])
  const politeTimer = useRef<number | null>(null)
  const assertiveTimer = useRef<number | null>(null)

  const processQueue = useCallback((priority: AnnouncePriority) => {
    const queue = priority === 'assertive' ? assertiveQueue : politeQueue
    const timerRef = priority === 'assertive' ? assertiveTimer : politeTimer
    const setMessage = priority === 'assertive' ? setAssertiveMessage : setPoliteMessage

    if (timerRef.current !== null || queue.current.length === 0) return // already processing, or nothing to do

    const next = queue.current.shift() as string
    setMessage('')
    timerRef.current = window.setTimeout(() => {
      setMessage(next)
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null
        processQueue(priority)
      }, HOLD_MS)
    }, SET_DELAY_MS)
  }, [])

  const announce = useCallback(
    (message: string, priority: AnnouncePriority = 'polite') => {
      const queue = priority === 'assertive' ? assertiveQueue : politeQueue
      queue.current.push(message)
      processQueue(priority)
    },
    [processQueue],
  )

  // These refs hold timer ids (plain numbers), not DOM nodes, so reading
  // .current at unmount time is intentional: it must see whatever the latest
  // announce() call scheduled, not a snapshot from when this effect was set up.
  useEffect(() => {
    return () => {
      // oxlint-disable-next-line react-hooks/exhaustive-deps
      if (politeTimer.current !== null) window.clearTimeout(politeTimer.current)
      // oxlint-disable-next-line react-hooks/exhaustive-deps
      if (assertiveTimer.current !== null) window.clearTimeout(assertiveTimer.current)
    }
  }, [])

  const messages = useMemo(() => ({ politeMessage, assertiveMessage }), [politeMessage, assertiveMessage])

  return (
    <AnnouncerContext.Provider value={announce}>
      <AnnouncerMessagesContext.Provider value={messages}>
        {children}
        <LiveRegionPair />
      </AnnouncerMessagesContext.Provider>
    </AnnouncerContext.Provider>
  )
}
