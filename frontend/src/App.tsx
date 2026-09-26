import { Fragment, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import LoadingScreen from './components/PantallaCarga'
import PageMeta from './components/PageMeta'
import RunNotifications from './components/RunNotifications'
import RequireAvailableScenario from './components/RequireEscenarioDisponible'
import RequireAuth from './components/RequireAuth'
import RequireSupervisor from './components/RequireSupervisor'
import { SCENARIOS, getScenarioPath } from './data/catalogo'
import Admin from './pages/Admin'
import Welcome from './pages/Bienvenida'
import ConfirmarCorreo from './pages/ConfirmarCorreo'
import BadgePreview from './pages/InsigniaPreview'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import ForgotPassword from './pages/OlvidePassword'
import DataPolicy from './pages/PoliticaDatos'
import TermsOfUse from './pages/TermsOfUse'
import Portada from './pages/Portada'
import TrainingHistory from './pages/Recorrido'
import Registration from './pages/Registro'
import RevisaTuCorreo from './pages/RevisaTuCorreo'
import ResetPassword from './pages/RestablecerPassword'
import Section from './pages/Seccion'
import VerifyCertificate from './pages/Verificar'
import { useAuth } from './context/AuthContext'

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <>
      <PageMeta />
      <RunNotifications enabled={isAuthenticated} />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Portada />} />
          <Route path="/login" element={<Login />} />
          <Route path="/olvide-password" element={<ForgotPassword />} />
          <Route path="/restablecer-password" element={<ResetPassword />} />
          <Route path="/registro" element={<Registration />} />
          <Route path="/revisa-tu-correo" element={<RevisaTuCorreo />} />
          <Route path="/confirmar-correo" element={<ConfirmarCorreo />} />
          <Route path="/politica-de-datos" element={<DataPolicy />} />
          <Route path="/terminos" element={<TermsOfUse />} />
          <Route path="/verificar/:codigo" element={<VerifyCertificate />} />

          {/* Solo en desarrollo: import.meta.env.DEV es una constante de
              build, así que Vite elimina esta ruta entera del bundle de
              producción (issue #230, para ver la insignia sin aprobar los
              7 módulos). */}
          {import.meta.env.DEV && (
            <Route path="/insignia-preview" element={<BadgePreview />} />
          )}

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

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
