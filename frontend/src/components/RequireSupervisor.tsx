import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../context/AuthContext'
import PantallaCarga from './PantallaCarga'

/// Puerta de la zona de supervisión. Un participante autenticado no entra: se
/// le manda a su panel. Sin sesión, al login.
function RequireSupervisor() {
  const { isAuthenticated, loading, isSupervisor } = useAuth()

  if (loading) {
    return <PantallaCarga />
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (!isSupervisor) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default RequireSupervisor
