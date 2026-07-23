import { useId } from 'react'
import type { ThemeChoice } from '../../settings/settingsTypes'

const THEME_OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: 'system', label: 'Match system' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'contrast-light', label: 'High contrast (light)' },
  { value: 'contrast-dark', label: 'High contrast (dark)' },
]

export function ThemeSelect({ value, onChange }: { value: ThemeChoice; onChange: (theme: ThemeChoice) => void }) {
  const id = useId()

  return (
    <div className="settings-field">
      <label htmlFor={id}>Theme</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value as ThemeChoice)}>
        {THEME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
