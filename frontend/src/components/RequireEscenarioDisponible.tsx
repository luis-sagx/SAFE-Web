import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import LoadingScreen from './PantallaCarga'
import { getSectionScenarios, type Scenario } from '../data/catalogo'
import { fetchProgress, type Progress } from '../lib/api'
import type { RunOutcome } from '../lib/api'
import { withAttemptedScenario, isScenarioAvailable } from '../lib/bloqueoEscenarios'

function RequireAvailableScenario({
  escenario: scenario,
  children,
}: {
  escenario: Scenario
  children: ReactNode
}) {
  // Viene del botón "Siguiente escenario": esa corrida se guarda en paralelo
  // y esta pantalla puede montarse antes de que el servidor la registre. Sin
  // esto, la comprobación de abajo vería el escenario recién terminado como
  // "sin intentar" y rebotaría de vuelta a la sección aunque sí se completó.
  const location = useLocation()
  const navigationState = location.state as {
    recienCompletado?: string
    iniciarRepeticion?: boolean
    repeticionIntentados?: { id: string; outcome: RunOutcome }[]
  } | null
  const recentlyCompleted = navigationState?.recienCompletado
  const startReplay = navigationState?.iniciarRepeticion
  const [progress, setProgress] = useState<Progress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    fetchProgress(scenario.seccionId)
      .then((p) => {
        if (!cancelled) setProgress(p)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [scenario.seccionId])

  if (loading) {
    return <LoadingScreen />
  }

  if (!error) {
    const catalog = getSectionScenarios(scenario.seccionId)
    const destinationIndex = catalog.findIndex((e) => e.id === scenario.id)
    const completedIndex = recentlyCompleted
      ? catalog.findIndex((e) => e.id === recentlyCompleted)
      : -1
    // La acción "Siguiente escenario" ya validó el orden y navega al vecino
    // inmediato. Durante esa ventana el POST puede seguir en vuelo; no hay
    // motivo para devolver al participante a la lista por una lectura vieja.
    const nextAfterRun = completedIndex >= 0 && destinationIndex === completedIndex + 1
    const provisionalAttempts = startReplay
      ? navigationState?.repeticionIntentados ?? []
      : recentlyCompleted ? [{ id: recentlyCompleted, outcome: 'CORRECTO' as const }] : []
    const effectiveProgress: Progress | null = progress
      ? provisionalAttempts.reduce(
          (current, attempt) => withAttemptedScenario(current, attempt.id, attempt.outcome, startReplay),
          progress,
        )
      : progress

    const available = nextAfterRun || isScenarioAvailable(
      catalog,
      effectiveProgress,
      scenario.id,
      { iniciandoRepeticion: startReplay },
    )

    if (!available) {
      // Con el título a cuestas: la sección lo usa para decir por qué cambió
      // la página sola. Sin eso, quien llega por un enlace guardado o por el
      // historial ve otra pantalla y no sabe si se equivocó de dirección, si
      // la aplicación falló o si le quitaron el acceso.
      return (
        <Navigate
          to={`/seccion/${scenario.seccionId}`}
          replace
          state={null}
        />
      )
    }
  }

  return children
}

export default RequireAvailableScenario
