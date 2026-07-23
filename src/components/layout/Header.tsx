import { SettingsPanel } from '../settingsPanel/SettingsPanel'

export function Header() {
  return (
    <header className="app-header">
      <h1>Sudoku</h1>
      <SettingsPanel />
    </header>
  )
}
