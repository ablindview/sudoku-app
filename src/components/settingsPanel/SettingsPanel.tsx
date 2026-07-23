import { useId, useRef } from 'react'
import { LiveRegionPair } from '../../a11y/LiveRegionPair'
import { useSettings } from '../../settings/useSettings'
import { CellSizeControl } from './CellSizeControl'
import { GridModeToggle } from './GridModeToggle'
import { ThemeSelect } from './ThemeSelect'

export function SettingsPanel() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { settings, updateSettings } = useSettings()
  const headingId = useId()
  const liveHintId = useId()

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()}>
        Settings
      </button>

      {/* Native <dialog> + showModal() provides focus trapping, Escape-to-close,
          and focus restoration to the trigger button, all without custom JS. */}
      <dialog ref={dialogRef} aria-labelledby={headingId} className="settings-dialog">
        <form method="dialog">
          <h2 id={headingId}>Settings</h2>

          <fieldset className="settings-section">
            <legend>Appearance</legend>
            <ThemeSelect value={settings.theme} onChange={(theme) => updateSettings({ theme })} />
            <CellSizeControl
              value={settings.cellSizeScale}
              onChange={(cellSizeScale) => updateSettings({ cellSizeScale })}
            />
          </fieldset>

          <fieldset className="settings-section">
            <legend>Gameplay</legend>
            <GridModeToggle value={settings.gridMode} onChange={(gridMode) => updateSettings({ gridMode })} />
            <label className="settings-checkbox-label">
              <input
                type="checkbox"
                checked={settings.autoCheckConflicts}
                onChange={(event) => updateSettings({ autoCheckConflicts: event.target.checked })}
              />
              Highlight conflicting cells automatically
            </label>
            <label className="settings-checkbox-label">
              <input
                type="checkbox"
                checked={settings.liveConflictAnnouncements}
                disabled={!settings.autoCheckConflicts}
                aria-describedby={settings.autoCheckConflicts ? undefined : liveHintId}
                onChange={(event) => updateSettings({ liveConflictAnnouncements: event.target.checked })}
              />
              Announce conflicts as you type
            </label>
            {!settings.autoCheckConflicts && (
              <p id={liveHintId} className="settings-hint">
                Requires &quot;Highlight conflicting cells automatically&quot; above.
              </p>
            )}
          </fieldset>

          <button type="submit">Close</button>
        </form>

        {/* Everything outside an open modal <dialog> becomes inert (hidden
            from the accessibility tree), which would silently swallow the
            app-root live regions if a message was queued right as this
            dialog opened. This mirrors the same shared announcer state so
            there's always a non-inert home for it while the dialog is open. */}
        <LiveRegionPair />
      </dialog>
    </>
  )
}
