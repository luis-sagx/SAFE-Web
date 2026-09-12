import { Fragment, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import LoadingScreen from './components/PantallaCarga'
import RunNotifications from './components/RunNotifications'
import RequireAvailableScenario from './components/RequireEscenarioDisponible'
import RequireAuth from './components/RequireAuth'
import RequireSupervisor from './components/RequireSupervisor'
import { SCENARIOS, getScenarioPath } from './data/catalogo'
import Admin from './pages/Admin'
import Welcome from './pages/Bienvenida'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import DataPolicy from './pages/PoliticaDatos'
import TrainingHistory from './pages/Recorrido'
import Registration from './pages/Registro'
import Section from './pages/Seccion'
import VerifyCertificate from './pages/Verificar'
import { useAuth } from './context/AuthContext'

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <>
      <RunNotifications enabled={isAuthenticated} />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/registro" element={<Registration />} />
          <Route path="/politica-de-datos" element={<DataPolicy />} />
          <Route path="/verificar/:codigo" element={<VerifyCertificate />} />

          <Route element={<RequireSupervisor />}>
            <Route path="/admin" element={<Admin />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="/bienvenida" element={<Welcome />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/recorrido" element={<TrainingHistory />} />
            <Route path="/seccion/:seccionId" element={<Section />} />

            {/* Una ruta por entrada del catálogo: agregar un escenario no obliga
                a tocar este archivo. */}
            {SCENARIOS.map((scenario) => {
              const { id, seccionId: sectionId, escenarioId: scenarioId, ruta: path, Component } = scenario
              const content = (
                <RequireAvailableScenario escenario={scenario}>
                  <Component />
                </RequireAvailableScenario>
              )

              return (
                <Fragment key={id}>
                  <Route path={getScenarioPath(scenario)} element={content} />
                  {path && (
                    <Route
                      path={`/seccion/${sectionId}/${scenarioId}`}
                      element={content}
                    />
                  )}
                </Fragment>
              )
            })}
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
