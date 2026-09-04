import { CheckCircle2, TriangleAlert, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import AppHeader from '../components/AppHeader'
import InfoLink from '../components/InfoLink'
import { escenariosDeSeccion, SECCIONES } from '../data/catalogo'
import { fetchMyRuns, type RunOutcome, type RunSummary } from '../lib/api'

/// Solo las secciones con escenarios pueden tener corridas que mostrar.
const SECCIONES_ACTIVAS = SECCIONES.filter((s) => escenariosDeSeccion(s.id).length > 0)

const TONO_OUTCOME: Record<RunOutcome, { Icono: typeof CheckCircle2; clase: string; texto: string }> = {
  CORRECTO: { Icono: CheckCircle2, clase: 'text-success', texto: 'Aprobado' },
  PARCIAL: { Icono: TriangleAlert, clase: 'text-warning', texto: 'A medias' },
  INCORRECTO: { Icono: XCircle, clase: 'text-danger', texto: 'No aprobado' },
}

function formatearDuracion(ms: number): string {
  const totalSegundos = Math.round(ms / 1000)
  const minutos = Math.floor(totalSegundos / 60)
  const segundos = totalSegundos % 60
  return `${minutos}:${String(segundos).padStart(2, '0')}`
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * La última corrida de cada escenario, la misma regla que usa el gating
 * (`calcularProgreso` en el backend): la de mayor `finishedAt`. Cualquier otra
 * regla —el mejor intento, el promedio— haría que esta pantalla contradijera
 * a la insignia "Aprobado" de la sección.
 */
function ultimaPorEscenario(runs: RunSummary[]): Map<string, RunSummary> {
  const ordenadas = [...runs].sort(
    (a, b) => new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime(),
  )
  const ultima = new Map<string, RunSummary>()
  for (const run of ordenadas) {
    ultima.set(run.scenarioId, run)
  }
  return ultima
}

function contarIntentos(runs: RunSummary[], scenarioId: string): number {
  return runs.filter((r) => r.scenarioId === scenarioId).length
}

/**
 * El historial propio del participante: qué jugó, con qué resultado quedó y
 * cuánto le tomó. Consume `GET /api/runs/me`, que ya existía sin ningún
 * llamador en la aplicación — nada de esto pide nada nuevo al servidor.
 *
 * Solo aparece lo que el participante ya jugó: un escenario sin intentar no
 * puede aparecer aquí, y con él tampoco se filtra su `naturaleza` antes de
 * tiempo (la misma protección que ya aplica `Seccion.tsx`).
 */
function Recorrido() {
  const [runs, setRuns] = useState<RunSummary[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetchMyRuns()
      .then((r) => {
        if (!cancelled) setRuns(r)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader>
        <Link to="/dashboard" className="text-sm font-medium text-link underline">
          ← Volver
        </Link>
        <InfoLink />
      </AppHeader>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.88px] text-muted">
          Entrenamiento
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">Tu recorrido</h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-body">
          Los escenarios que ya jugaste, con el resultado de tu último intento en cada uno.
        </p>

        {error && (
          <p className="mt-10 rounded-lg border border-hairline-strong bg-surface p-5 text-base text-body">
            No se pudo cargar tu recorrido. Vuelve a intentarlo más tarde.
          </p>
        )}

        {!error && runs === null && (
          <p className="mt-10 text-base text-muted">Cargando…</p>
        )}

        {!error && runs !== null && runs.length === 0 && (
          <p className="mt-10 rounded-lg border border-hairline-strong bg-surface p-5 text-base text-body">
            Todavía no has jugado ningún escenario.
          </p>
        )}

        {!error && runs !== null && runs.length > 0 && (
          <div className="mt-10 flex flex-col gap-8">
            {SECCIONES_ACTIVAS.map((seccion) => {
              const escenarios = escenariosDeSeccion(seccion.id)
              const ultima = ultimaPorEscenario(runs)
              const jugados = escenarios.filter((e) => ultima.has(e.id))

              if (jugados.length === 0) return null

              return (
                <section key={seccion.id} aria-labelledby={`titulo-${seccion.id}`}>
                  <h2
                    id={`titulo-${seccion.id}`}
                    className="flex items-center gap-2 text-lg font-semibold text-ink"
                  >
                    <seccion.Icono aria-hidden className="size-4 text-link" strokeWidth={2} />
                    {seccion.titulo}
                  </h2>

                  <ul className="mt-3 flex flex-col gap-2">
                    {jugados.map((escenario) => {
                      const run = ultima.get(escenario.id)
                      if (!run) return null
                      const tono = TONO_OUTCOME[run.outcome]
                      const intentos = contarIntentos(runs, escenario.id)

                      return (
                        <li
                          key={escenario.id}
                          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border border-hairline-strong bg-surface p-4"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <tono.Icono
                              aria-hidden
                              className={`size-4 shrink-0 ${tono.clase}`}
                              strokeWidth={2.5}
                            />
                            <span className="truncate text-base font-medium text-ink">
                              {escenario.titulo}
                            </span>
                          </div>

                          <div className="flex shrink-0 items-center gap-4 text-sm text-body">
                            <span className={`font-medium ${tono.clase}`}>{tono.texto}</span>
                            <span className="tabular-nums text-muted">{run.score}/100</span>
                            <span className="tabular-nums text-muted">
                              {formatearDuracion(run.durationMs)}
                            </span>
                            <span className="tabular-nums text-muted">
                              {intentos === 1 ? '1 intento' : `${intentos} intentos`}
                            </span>
                            <span className="text-muted">{formatearFecha(run.finishedAt)}</span>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default Recorrido
