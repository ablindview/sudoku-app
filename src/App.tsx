import { LiveAnnouncerProvider } from './a11y/LiveAnnouncerProvider'
import { SudokuGrid } from './components/grid/SudokuGrid'
import { Header } from './components/layout/Header'
import { StatusBar } from './components/layout/StatusBar'
import { Toolbar } from './components/layout/Toolbar'
import { GameProvider } from './game/GameProvider'
import { SettingsProvider } from './settings/SettingsProvider'

function App() {
  return (
    <SettingsProvider>
      <LiveAnnouncerProvider>
        <GameProvider>
          <div className="app-shell">
            <Header />
            <main>
              <Toolbar />
              <SudokuGrid />
              <StatusBar />
            </main>
          </div>
        </GameProvider>
      </LiveAnnouncerProvider>
    </SettingsProvider>
  )
}

export default App
