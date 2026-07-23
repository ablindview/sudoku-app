import { useContext } from 'react'
import { AnnouncerMessagesContext } from './announcerContext'

/**
 * The actual polite/assertive live-region elements, reading from shared
 * announcer state. Rendered once at the app root (LiveAnnouncerProvider) AND
 * again inside SettingsPanel's <dialog> — only one copy is ever non-inert at
 * a time (everything outside an open modal <dialog> is inert), so this never
 * double-announces, but it does mean a message queued right as the dialog
 * opens still has a live home to land in.
 */
export function LiveRegionPair() {
  const messages = useContext(AnnouncerMessagesContext)
  if (!messages) return null

  return (
    <>
      <output className="visually-hidden" aria-live="polite">
        {messages.politeMessage}
      </output>
      <div className="visually-hidden" aria-live="assertive" role="alert">
        {messages.assertiveMessage}
      </div>
    </>
  )
}
