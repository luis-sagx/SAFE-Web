import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext'

const BIENVENIDA = '/bienvenida'

// Puerta única de la zona autenticada: si un escenario está montado, ya hay
// sesión válida y no necesita comprobarla otra vez.
function RequireAuth() {
  const { isAuthenticated, loading, participant, onboardingDismissed } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="p-10 text-base text-muted">Cargando…</p>
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
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
    location.pathname !== BIENVENIDA
  ) {
    return <Navigate to={BIENVENIDA} replace />
  }

  return <Outlet />
}

export default RequireAuth
