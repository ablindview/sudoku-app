import { SettingsPanel } from '../settingsPanel/SettingsPanel'

export function Header() {
  return (
    <header className="app-header">
      <div className="app-title-row">
        <h1>Accessible Sudoku</h1>
        <span className="beta-badge">BETA</span>
      </div>
      <SettingsPanel />
    </header>
  )
}
