import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
// Fuentes servidas desde el propio bundle: antes venían de Google Fonts vía
// <link>, y si esa petición fallaba o se bloqueaba (red, extensión,
// firewall) el navegador caía a system-ui, que tiene métricas distintas y se
// leía más amontonado que con Manrope cargada. Self-host quita esa variable.
//
// Solo el subset `latin`: cubre todo el español (tildes, ñ, ¿¡, comillas y
// guiones tipográficos). Los `400.css` completos arrastraban al bundle también
// cyrillic, greek y vietnamese, unos 1.2 MB de fuentes que nadie descargaba.
import '@fontsource/manrope/latin-400.css'
import '@fontsource/manrope/latin-500.css'
import '@fontsource/manrope/latin-600.css'
import '@fontsource/manrope/latin-700.css'
import '@fontsource/manrope/latin-800.css'
import '@fontsource/oswald/latin-500.css'
import '@fontsource/oswald/latin-600.css'
import '@fontsource/oswald/latin-700.css'
import '@fontsource/ibm-plex-serif/latin-400.css'
import '@fontsource/ibm-plex-serif/latin-400-italic.css'
import '@fontsource/ibm-plex-serif/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import './index.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* Fuera de AuthProvider: el tema no depende de la sesión y tiene que
          existir también en las rutas públicas (Login, Registro, Verificar). */}
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
