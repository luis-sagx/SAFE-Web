import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
// Fuentes servidas desde el propio bundle: antes venían de Google Fonts vía
// <link>, y si esa petición fallaba o se bloqueaba (red, extensión,
// firewall) el navegador caía a system-ui, que tiene métricas distintas y se
// leía más amontonado que con Manrope cargada. Self-host quita esa variable.
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'
import '@fontsource/oswald/500.css'
import '@fontsource/oswald/600.css'
import '@fontsource/oswald/700.css'
import '@fontsource/ibm-plex-serif/400.css'
import '@fontsource/ibm-plex-serif/400-italic.css'
import '@fontsource/ibm-plex-serif/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import './index.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
