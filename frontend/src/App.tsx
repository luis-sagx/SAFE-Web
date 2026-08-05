import { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import RequireEscenarioDisponible from './components/RequireEscenarioDisponible'
import RequireAuth from './components/RequireAuth'
import { ESCENARIOS } from './data/catalogo'
import Bienvenida from './pages/Bienvenida'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Seccion from './pages/Seccion'

function App() {
  return (
    <Suspense fallback={<p className="p-10 text-base text-muted">Cargando…</p>}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        <Route element={<RequireAuth />}>
          <Route path="/bienvenida" element={<Bienvenida />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/seccion/:seccionId" element={<Seccion />} />

          {/* Una ruta por entrada del catálogo: agregar un escenario no obliga
              a tocar este archivo. */}
          {ESCENARIOS.map((escenario) => {
            const { id, seccionId, escenarioId, Component } = escenario

            return (
              <Route
                key={id}
                path={`/seccion/${seccionId}/${escenarioId}`}
                element={
                  <RequireEscenarioDisponible escenario={escenario}>
                    <Component />
                  </RequireEscenarioDisponible>
                }
              />
            )
          })}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
