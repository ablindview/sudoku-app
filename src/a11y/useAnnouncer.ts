import { useContext } from 'react'
import { AnnouncerContext } from './announcerContext'

export function useAnnouncer() {
  const announce = useContext(AnnouncerContext)
  if (!announce) throw new Error('useAnnouncer must be used within a LiveAnnouncerProvider')
  return announce
}
