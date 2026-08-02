import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../context/AuthContext'

// Puerta única de la zona autenticada: si un escenario está montado, ya hay
// sesión válida y no necesita comprobarla otra vez.
function RequireAuth() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <p className="p-10 text-base text-muted">Cargando…</p>
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />
}

export default RequireAuth
