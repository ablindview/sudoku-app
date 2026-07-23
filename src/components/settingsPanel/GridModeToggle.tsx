import { useId } from 'react'
import type { GridMode } from '../../settings/settingsTypes'

export function GridModeToggle({ value, onChange }: { value: GridMode; onChange: (mode: GridMode) => void }) {
  const name = useId()

  return (
    <fieldset className="settings-field">
      <legend>Grid style</legend>
      <label className="settings-radio-label">
        <input
          type="radio"
          name={name}
          value="a11yGrid"
          checked={value === 'a11yGrid'}
          onChange={() => onChange('a11yGrid')}
        />
        Arrow-key grid — one tab stop, arrow keys move between cells
      </label>
      <label className="settings-radio-label">
        <input
          type="radio"
          name={name}
          value="inputTable"
          checked={value === 'inputTable'}
          onChange={() => onChange('inputTable')}
        />
        Individual cell inputs — Tab moves through all 81 cells
      </label>
    </fieldset>
  )
}
