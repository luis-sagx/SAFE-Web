import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import AppHeader from '../components/AppHeader'
import InfoLink from '../components/InfoLink'
import { escenariosDeSeccion, getSeccion } from '../data/catalogo'
import { fetchProgreso, type Progreso } from '../lib/api'

function Seccion() {
  const { seccionId } = useParams()
  const seccion = getSeccion(seccionId)
  const [progreso, setProgreso] = useState<Progreso | null>(null)

  // getSeccion() devuelve un objeto nuevo en cada render: la dependencia es
  // seccion?.id, no seccion, para no pedir el progreso de nuevo en cada uno.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Una sección sin escenarios no tiene gating configurado en el backend:
    // pedirlo solo daría un 404 esperado.
    if (!seccion || escenariosDeSeccion(seccion.id).length === 0) return
    let cancelled = false

    fetchProgreso(seccion.id)
      .then((p) => {
        if (!cancelled) setProgreso(p)
      })
      .catch(() => {
        // El progreso es informativo: si no carga, la sección sigue usable.
      })

    return () => {
      cancelled = true
    }
  }, [seccion?.id])

  if (!seccion) {
    return <Navigate to="/dashboard" replace />
  }

  const escenarios = escenariosDeSeccion(seccion.id)

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader>
        <Link to="/dashboard" className="text-sm font-medium text-link underline">
          ← Volver
        </Link>
        <InfoLink />
      </AppHeader>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <span className="flex size-10 items-center justify-center rounded-md bg-surface-strong text-link">
          <seccion.Icono aria-hidden className="size-5" strokeWidth={1.75} />
        </span>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink">{seccion.titulo}</h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-body">{seccion.descripcion}</p>

        {progreso && (
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-surface-strong px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.88px] text-ink">
            {progreso.aprobados}/{escenarios.length} aprobados · necesitas {progreso.requeridos}
          </p>
        )}

        {escenarios.length === 0 ? (
          <p className="mt-10 rounded-lg border border-hairline-strong bg-surface p-5 text-base text-body">
            Estamos preparando los escenarios de esta sección.
          </p>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {escenarios.map((escenario) => {
              // Sin intentar no muestra ninguna insignia: mostrar algo distinto
              // de "aprobado"/"falta" antes de jugarlo delataría si el
              // escenario es fraude o legítimo, y el menú no puede hacer eso.
              const ultimo = progreso?.escenarios.find((e) => e.id === escenario.id)
                ?.ultimoOutcome

              return (
                <Link
                  key={escenario.id}
                  to={`/seccion/${escenario.seccionId}/${escenario.escenarioId}`}
                  className="rounded-lg border border-hairline-strong bg-surface p-5 transition hover:-translate-y-0.5 hover:border-link/40 hover:shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-ink">{escenario.titulo}</h2>
                    {ultimo === 'CORRECTO' && (
                      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.88px] text-success">
                        Aprobado
                      </span>
                    )}
                    {ultimo !== undefined && ultimo !== 'CORRECTO' && (
                      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">
                        Falta
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-base leading-relaxed text-body">
                    {escenario.descripcion}
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default Seccion
