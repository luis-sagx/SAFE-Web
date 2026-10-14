import { useEffect, useState } from 'react'
import { fetchAssessmentStatus, type AssessmentStatus } from '../lib/api'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext'
import LoadingScreen from './PantallaCarga'

const WELCOME = '/bienvenida'

// Puerta única de la zona autenticada: si un escenario está montado, ya hay
// sesión válida y no necesita comprobarla otra vez.
function RequireAuth() {
  const { isAuthenticated, loading, isAdmin, participant, onboardingDismissed } = useAuth()
  const location = useLocation()
  const [assessment, setAssessment] = useState<{ participantId: string; path: string; status?: AssessmentStatus; error?: string } | null>(null)
  const [retry, setRetry] = useState(0)
  const needsAssessment = isAuthenticated && participant?.role === 'PARTICIPANT'

  useEffect(() => {
    if (!needsAssessment) return
    let cancelled = false
    fetchAssessmentStatus().then(
      (status) => { if (!cancelled) setAssessment({ participantId: participant!.id, path: location.pathname, status }) },
      () => { if (!cancelled) setAssessment({ participantId: participant!.id, path: location.pathname, error: 'No pudimos comprobar tu evaluación. Reintenta para continuar.' }) },
    )
    return () => { cancelled = true }
  }, [needsAssessment, participant?.id, location.pathname, retry])

  if (loading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // El supervisor no hace escenarios: su zona es /admin, no el panel del
  // participante ni la bienvenida.
  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  if (needsAssessment) {
    if (!assessment || assessment.path !== location.pathname || assessment.participantId !== participant?.id) return <LoadingScreen />
    if (assessment.error) return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p role="alert" className="text-danger">{assessment.error}</p>
        <button type="button" className="mt-4 min-h-11 rounded-md border border-control px-4 text-ink" onClick={() => { setAssessment(null); setRetry((value) => value + 1) }}>Reintentar</button>
      </main>
    )
    if (assessment.status?.pretestRequired && location.pathname !== '/evaluacion-inicial') {
      return <Navigate to="/evaluacion-inicial" replace />
    }
  }

  if (location.pathname === '/evaluacion-inicial' || location.pathname === '/evaluacion-final') return <Outlet />

  // Primer ingreso, o pidió que volviera a aparecer (ver ícono ⓘ): manda a la
  // bienvenida antes que a cualquier otra pantalla. onboardingDismissed cubre
  // la sesión actual: si acaba de continuar dejando el checkbox desmarcado,
  // igual puede salir ahora, el flag desmarcado solo reactiva el aviso en el
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
