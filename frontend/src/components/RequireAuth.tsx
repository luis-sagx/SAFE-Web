import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext'

const BIENVENIDA = '/bienvenida'

// Puerta única de la zona autenticada: si un escenario está montado, ya hay
// sesión válida y no necesita comprobarla otra vez.
function RequireAuth() {
  const { isAuthenticated, loading, participant } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="p-10 text-base text-muted">Cargando…</p>
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // Primer ingreso, o pidió que volviera a aparecer (ver ícono ⓘ): manda a la
  // bienvenida antes que a cualquier otra pantalla. La comparación con
  // BIENVENIDA evita el bucle: una vez ahí, se queda ahí hasta que continúe.
  if (participant && !participant.onboardingVisto && location.pathname !== BIENVENIDA) {
    return <Navigate to={BIENVENIDA} replace />
  }

  return <Outlet />
}

export default RequireAuth
