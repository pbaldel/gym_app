import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './ui/theme.css'
import App from './App.tsx'

// Con registerType 'autoUpdate', la página se recarga sola cuando se activa
// una versión nueva, sin tener que cerrar y abrir la app dos veces.
// Los datos no se pierden: cada serie se guarda en IndexedDB al instante y
// la ruta (en el hash) se conserva al recargar.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
