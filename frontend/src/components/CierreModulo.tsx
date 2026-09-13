import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Scenario, Section } from '../data/catalogo'
import { fetchMyRuns, type Progress } from '../lib/api'

// Los cuatro discriminadores del diseño pedagógico (spec 2026-07-25 §3.1), fijos para
// los seis módulos. El tercero va destacado: el propio diseño lo llama el más fiable y
// el más fácil de usar sin conocimiento técnico.
const DISCRIMINATORS = [
  {
    pregunta: '¿Qué te piden?',
    legitimo: 'Que actúes por tu cuenta, en tu app, en la ventanilla.',
    fraude: 'Credenciales, códigos o dinero, en el momento.',
  },
  {
    pregunta: '¿Resiste la verificación?',
    legitimo: 'Sale confirmado al verificar por tu propio canal.',
    fraude: 'Se cae, o presionan para que no verifiques.',
  },
  {
    pregunta: '¿Cómo reacciona a tu duda?',
    legitimo: 'Sin molestarse; te espera.',
    fraude: 'Excusas, prisa, culpa, o desaparece.',
    destacado: true,
  },
  {
    pregunta: '¿Adónde va el dinero?',
    legitimo: 'A la entidad, por su canal oficial.',
    fraude: 'A una persona natural, o a una cuenta nueva.',
  },
] as const

function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000)
  if (totalMinutes < 1) return 'menos de un minuto'
  return totalMinutes === 1 ? '1 minuto' : `${totalMinutes} minutos`
}

interface ModuleCompletionProps {
  seccion: Section
  escenarios: Scenario[]
  progreso: Progress
}

// Contenido pedagógico (los discriminadores), no una animación de recompensa. Vive en un
// modal y no en el flujo de la página: un bloque de este tamaño siempre visible al volver
// a la sección ya aprobada competía con las tarjetas de escenarios.
function ModuleCompletion({ seccion: section, escenarios: scenarios, progreso: progress }: ModuleCompletionProps) {
  const [durationMs, setDurationMs] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchMyRuns()
      .then((runs) => {
        if (cancelled) return
        // Último intento por escenario, la misma regla que el gating: sumar
        // todos los intentos contaría también los que no valieron para
        // aprobar.
        const latestByScenario = new Map<string, number>()
        const own = [...runs]
          .filter((r) => r.scenarioId.startsWith(`${section.id}/`))
          .sort((a, b) => new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime())
        for (const run of own) {
          latestByScenario.set(run.scenarioId, run.durationMs)
        }
        const total = [...latestByScenario.values()].reduce((sum, ms) => sum + ms, 0)
        setDurationMs(total)
      })
      .catch(() => {
        // Informativo: sin el tiempo, el cierre se muestra igual.
      })

    return () => {
      cancelled = true
    }
  }, [section.id])

  return (
    <section
      aria-labelledby="titulo-cierre"
      className="rounded-lg border border-mint-mid bg-mint-light/40 p-5"
    >
      <p
        id="titulo-cierre"
        className="flex items-center gap-1.5 text-sm font-semibold text-primary"
      >
        <CheckCircle2 aria-hidden className="size-4" strokeWidth={2.5} />
        Módulo aprobado
      </p>

      <p className="mt-2 text-base leading-relaxed text-body">
        Aprobaste <span className="font-semibold text-ink tabular-nums">{progress.aprobados}</span>{' '}
        de los <span className="tabular-nums">{scenarios.length}</span> escenarios de{' '}
        {section.titulo}
        {durationMs !== null && <> en {formatDuration(durationMs)}</>}. Puedes repetir el módulo completo
        cuando quieras.
      </p>

      <ul aria-label="Resultado por escenario" className="mt-4 grid gap-2 sm:grid-cols-2">
        {scenarios.map((scenario) => {
          const result = progress.escenarios.find((e) => e.id === scenario.id)
          const ok = result?.ultimoOutcome === 'CORRECTO'
          return <li key={scenario.id} className="flex items-center gap-2 text-sm text-body">
            <span aria-hidden className={ok ? 'text-success-ink' : 'text-danger'}>{ok ? '✓' : '✗'}</span>
            {scenario.titulo}
          </li>
        })}
      </ul>

      <div className="mt-5 overflow-x-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.88px] text-muted">
          Lo que distingue a uno de otro
        </p>

        <dl className="mt-3 flex flex-col gap-3">
          {DISCRIMINATORS.map((d) => (
            <div
              key={d.pregunta}
              className={`rounded-md border p-3 ${
                'destacado' in d && d.destacado
                  ? 'border-primary/40 bg-surface'
                  : 'border-hairline-strong bg-surface'
              }`}
            >
              <dt className="text-sm font-semibold text-ink">{d.pregunta}</dt>
              <dd className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                <span className="text-sm leading-relaxed text-body">
                  <span className="font-medium text-success-ink">Legítimo:</span> {d.legitimo}
                </span>
                <span className="text-sm leading-relaxed text-body">
                  <span className="font-medium text-danger">Fraude:</span> {d.fraude}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export default ModuleCompletion
