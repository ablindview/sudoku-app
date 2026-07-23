import { useId } from 'react'
import { CELL_SIZE_SCALE_MAX, CELL_SIZE_SCALE_MIN, CELL_SIZE_SCALE_STEP } from '../../settings/settingsTypes'

export function CellSizeControl({ value, onChange }: { value: number; onChange: (scale: number) => void }) {
  const id = useId()
  const percent = Math.round(value * 100)

  return (
    <div className="settings-field">
      {/* The percentage is spoken once via aria-valuetext below, not repeated
          in the accessible name — the visible span is sighted-only. */}
      <label htmlFor={id}>
        Cell size <span aria-hidden="true">({percent}%)</span>
      </label>
      <input
        id={id}
        type="range"
        min={CELL_SIZE_SCALE_MIN}
        max={CELL_SIZE_SCALE_MAX}
        step={CELL_SIZE_SCALE_STEP}
        value={value}
        aria-valuetext={`${percent}%`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}
