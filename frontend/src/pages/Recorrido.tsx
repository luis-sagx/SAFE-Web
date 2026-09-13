import { CheckCircle2, Loader2, TriangleAlert, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import AppHeader, { BACK_CLASS } from '../components/AppHeader'
import { getSectionScenarios, SECTIONS } from '../data/catalogo'
import { fetchMyRuns, type RunOutcome, type RunSummary } from '../lib/api'

/// Solo las secciones con escenarios pueden tener corridas que mostrar.
const SECTIONS_ACTIVE = SECTIONS.filter((s) => getSectionScenarios(s.id).length > 0)

const TONE_OUTCOME: Record<RunOutcome, { Icono: typeof CheckCircle2; clase: string; texto: string }> = {
  CORRECTO: { Icono: CheckCircle2, clase: 'text-success-ink', texto: 'Aprobado' },
  PARCIAL: { Icono: TriangleAlert, clase: 'text-warning', texto: 'A medias' },
  INCORRECTO: { Icono: XCircle, clase: 'text-danger', texto: 'No aprobado' },
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Última corrida por escenario: misma regla que el gating del backend (mayor finishedAt), para no contradecir la insignia "Aprobado".
function latestByScenario(runs: RunSummary[]): Map<string, RunSummary> {
  const sorted = [...runs].sort(
    (a, b) => new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime(),
  )
  const latest = new Map<string, RunSummary>()
  for (const run of sorted) {
    latest.set(run.scenarioId, run)
  }
  return latest
}

function countAttempts(runs: RunSummary[], scenarioId: string): number {
  return runs.filter((r) => r.scenarioId === scenarioId).length
}

// Usa GET /api/runs/me (ya existía, sin llamador). Solo escenarios ya jugados: no se filtra su naturaleza antes de tiempo.
function TrainingHistory() {
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
      <AppHeader
        atras={
          <Link to="/dashboard" className={BACK_CLASS}>
            ← Volver
          </Link>
        }
      />

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
          <p role="status" className="mt-10 flex items-center gap-2 text-base text-muted">
            <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
            Cargando…
          </p>
        )}

        {!error && runs !== null && runs.length === 0 && (
          <p className="mt-10 rounded-lg border border-hairline-strong bg-surface p-5 text-base text-body">
            Todavía no has jugado ningún escenario.
          </p>
        )}

        {!error && runs !== null && runs.length > 0 && (
          <div className="mt-10 flex flex-col gap-8">
            {SECTIONS_ACTIVE.map((section) => {
              const scenarios = getSectionScenarios(section.id)
              const latest = latestByScenario(runs)
              const played = scenarios.filter((e) => latest.has(e.id))

              if (played.length === 0) return null

              return (
                <section key={section.id} aria-labelledby={`titulo-${section.id}`}>
                  <h2
                    id={`titulo-${section.id}`}
                    className="flex items-center gap-2 text-lg font-semibold text-ink"
                  >
                    <section.Icono aria-hidden className="size-4 text-link" strokeWidth={2} />
                    {section.titulo}
                  </h2>

                  <ul className="mt-3 flex flex-col gap-2">
                    {played.map((scenario) => {
                      const run = latest.get(scenario.id)
                      if (!run) return null
                      const tone = TONE_OUTCOME[run.outcome]
                      const attempts = countAttempts(runs, scenario.id)

                      return (
                        <li
                          key={scenario.id}
                          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border border-hairline-strong bg-surface p-4"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <tone.Icono
                              aria-hidden
                              className={`size-4 shrink-0 ${tone.clase}`}
                              strokeWidth={2.5}
                            />
                            <span className="truncate text-base font-medium text-ink">
                              {scenario.titulo}
                            </span>
                          </div>

                          <div className="flex shrink-0 items-center gap-4 text-sm text-body">
                            <span className={`font-medium ${tone.clase}`}>{tone.texto}</span>
                            <span className="tabular-nums text-muted">{run.score}/100</span>
                            <span className="tabular-nums text-muted">
                              {formatDuration(run.durationMs)}
                            </span>
                            <span className="tabular-nums text-muted">
                              {attempts === 1 ? '1 intento' : `${attempts} intentos`}
                            </span>
                            <span className="text-muted">{formatDate(run.finishedAt)}</span>
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

export default TrainingHistory
