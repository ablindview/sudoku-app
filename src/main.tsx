import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyCellSizeScale, applyResolvedTheme } from './settings/domEffects'
import { readMediaQueryPrefs, resolveTheme } from './settings/themeResolution'
import { sanitizeSettings, SETTINGS_STORAGE_KEY } from './settings/settingsTypes'
import { readJSON } from './utils/localStorage'
import './styles/base.css'
import './styles/theme.css'
import './styles/grid.css'
import App from './App.tsx'

// Applied synchronously, before React mounts, so the correct theme and cell
// size are in place for the very first paint (no flash of the wrong theme).
const initialSettings = sanitizeSettings(readJSON(SETTINGS_STORAGE_KEY, {}))
applyResolvedTheme(resolveTheme(initialSettings.theme, readMediaQueryPrefs()))
applyCellSizeScale(initialSettings.cellSizeScale)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
