import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import PantallaCarga from './PantallaCarga'
import { escenariosDeSeccion, type Escenario } from '../data/catalogo'
import { fetchProgreso, type Progreso } from '../lib/api'
import { escenarioEstaDisponible } from '../lib/bloqueoEscenarios'

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
  const recienCompletado = (location.state as { recienCompletado?: string } | null)
    ?.recienCompletado
  const iniciarRepeticion = (location.state as { iniciarRepeticion?: boolean } | null)?.iniciarRepeticion
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
    const yaLoContabaProgreso = !recienCompletado || Boolean(
      progreso?.escenarios.some((e) => e.id === recienCompletado) ||
      progreso?.rondaEnCurso?.escenarios.some((e) => e.id === recienCompletado),
    )
    const progresoEfectivo: Progreso | null =
      progreso && recienCompletado && !yaLoContabaProgreso
        ? progreso.rondaEnCurso
          ? {
              ...progreso,
              rondaEnCurso: {
                ...progreso.rondaEnCurso,
                escenarios: [...progreso.rondaEnCurso.escenarios, { id: recienCompletado, ultimoOutcome: 'CORRECTO' }],
              },
            }
          : {
              ...progreso,
              escenarios: [...progreso.escenarios, { id: recienCompletado, ultimoOutcome: 'CORRECTO' }],
            }
        : progreso

    const disponible = escenarioEstaDisponible(
      escenariosDeSeccion(escenario.seccionId),
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
