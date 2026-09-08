import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import PantallaCarga from './PantallaCarga'
import { escenariosDeSeccion, type Escenario } from '../data/catalogo'
import { fetchProgreso, type Progreso } from '../lib/api'
import type { RunOutcome } from '../lib/api'
import { conEscenarioIntentado, escenarioEstaDisponible } from '../lib/bloqueoEscenarios'

function RequireEscenarioDisponible({
  escenario,
  children,
}: {
  escenario: Escenario
  children: ReactNode
}) {
  // Viene del botón "Siguiente escenario": esa corrida se guarda en paralelo
  // y esta pantalla puede montarse antes de que el servidor la registre. Sin
  // esto, la comprobación de abajo vería el escenario recién terminado como
  // "sin intentar" y rebotaría de vuelta a la sección aunque sí se completó.
  const location = useLocation()
  const estadoNavegacion = location.state as {
    recienCompletado?: string
    iniciarRepeticion?: boolean
    repeticionIntentados?: { id: string; outcome: RunOutcome }[]
  } | null
  const recienCompletado = estadoNavegacion?.recienCompletado
  const iniciarRepeticion = estadoNavegacion?.iniciarRepeticion
  const [progreso, setProgreso] = useState<Progreso | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    fetchProgreso(escenario.seccionId)
      .then((p) => {
        if (!cancelled) setProgreso(p)
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
  }, [escenario.seccionId])

  if (loading) {
    return <PantallaCarga />
  }

  if (!error) {
    const catalogo = escenariosDeSeccion(escenario.seccionId)
    const indiceDestino = catalogo.findIndex((e) => e.id === escenario.id)
    const indiceCompletado = recienCompletado
      ? catalogo.findIndex((e) => e.id === recienCompletado)
      : -1
    // La acción "Siguiente escenario" ya validó el orden y navega al vecino
    // inmediato. Durante esa ventana el POST puede seguir en vuelo; no hay
    // motivo para devolver al participante a la lista por una lectura vieja.
    const siguienteTrasUnaCorrida = indiceCompletado >= 0 && indiceDestino === indiceCompletado + 1
    const intentosProvisionales = iniciarRepeticion
      ? estadoNavegacion?.repeticionIntentados ?? []
      : recienCompletado ? [{ id: recienCompletado, outcome: 'CORRECTO' as const }] : []
    const progresoEfectivo: Progreso | null = progreso
      ? intentosProvisionales.reduce(
          (actual, intento) => conEscenarioIntentado(actual, intento.id, intento.outcome, iniciarRepeticion),
          progreso,
        )
      : progreso

    const disponible = siguienteTrasUnaCorrida || escenarioEstaDisponible(
      catalogo,
      progresoEfectivo,
      escenario.id,
      { iniciandoRepeticion: iniciarRepeticion },
    )

    if (!disponible) {
      // Con el título a cuestas: la sección lo usa para decir por qué cambió
      // la página sola. Sin eso, quien llega por un enlace guardado o por el
      // historial ve otra pantalla y no sabe si se equivocó de dirección, si
      // la aplicación falló o si le quitaron el acceso.
      return (
        <Navigate
          to={`/seccion/${escenario.seccionId}`}
          replace
          state={null}
        />
      )
    }
  }

  return children
}

export default RequireEscenarioDisponible
