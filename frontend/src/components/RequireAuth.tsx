import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext'
import LoadingScreen from './PantallaCarga'

const WELCOME = '/bienvenida'

// Puerta única de la zona autenticada: si un escenario está montado, ya hay
// sesión válida y no necesita comprobarla otra vez.
function RequireAuth() {
  const { isAuthenticated, loading, isSupervisor, participant, onboardingDismissed } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // El supervisor no hace escenarios: su zona es /admin, no el panel del
  // participante ni la bienvenida.
  if (isSupervisor) {
    return <Navigate to="/admin" replace />
  }

  // Primer ingreso, o pidió que volviera a aparecer (ver ícono ⓘ): manda a la
  // bienvenida antes que a cualquier otra pantalla. onboardingDismissed cubre
  // la sesión actual: si acaba de continuar dejando el checkbox desmarcado,
  // igual puede salir ahora — el flag desmarcado solo reactiva el aviso en el
  // próximo ingreso, no debe atraparlo aquí.
  if (
    participant &&
    !participant.onboardingVisto &&
    !onboardingDismissed &&
    location.pathname !== WELCOME
  ) {
    // Con el destino al que iba: tras el aviso se sigue hasta ahí, en vez de
    // aterrizar siempre en el panel.
    return <Navigate to={WELCOME} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export default RequireAuth
