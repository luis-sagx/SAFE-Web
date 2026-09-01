import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router'
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
    return <p className="p-10 text-base text-muted">Cargando…</p>
  }

  if (!error) {
    const disponible = escenarioEstaDisponible(
      escenariosDeSeccion(escenario.seccionId),
      progreso,
      escenario.id,
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
          state={{ bloqueado: escenario.titulo }}
        />
      )
    }
  }

  return children
}

export default RequireEscenarioDisponible
