import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Escenario, Seccion as SeccionCatalogo } from '../data/catalogo'
import { fetchMyRuns, type Progreso } from '../lib/api'

/**
 * Los cuatro discriminadores del diseño pedagógico
 * (`docs/superpowers/specs/2026-07-25-escenarios-ciberamenazas-design.md`
 * §3.1): lo que distingue un caso legítimo de uno de fraude cuando la
 * redacción, el logo y el formato ya no lo delatan. Contenido fijo, igual
 * para los seis módulos — es la lección que se repite entre todos, no una
 * particular de cada uno.
 *
 * El tercero va marcado aparte porque el propio diseño lo llama el más
 * fiable y el más fácil de usar sin conocimiento técnico: no exige leer un
 * dominio ni entender un OTP, solo notar si quien contacta se ofende porque
 * verificas.
 */
const DISCRIMINADORES = [
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

function formatearDuracion(ms: number): string {
  const totalMinutos = Math.round(ms / 60000)
  if (totalMinutos < 1) return 'menos de un minuto'
  return totalMinutos === 1 ? '1 minuto' : `${totalMinutos} minutos`
}

interface CierreModuloProps {
  seccion: SeccionCatalogo
  escenarios: Escenario[]
  progreso: Progreso
}

/**
 * Contenido pedagógico —los cuatro discriminadores— y no una animación de
 * recompensa: es lo único del diseño que enseña a discriminar en vez de a
 * reconocer señales sueltas.
 *
 * Se muestra dentro de `CierreModuloModal` y no en el flujo de la página: un
 * bloque de este tamaño permanentemente visible cada vez que se vuelve a la
 * sección, ya aprobada, competía con las tarjetas de escenarios. Como modal,
 * el participante lo abre cuando quiere repasarlo y no cuando la página
 * decide mostrarlo.
 */
function CierreModulo({ seccion, escenarios, progreso }: CierreModuloProps) {
  const [duracionMs, setDuracionMs] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchMyRuns()
      .then((runs) => {
        if (cancelled) return
        // Último intento por escenario, la misma regla que el gating: sumar
        // todos los intentos contaría también los que no valieron para
        // aprobar.
        const ultimaPorEscenario = new Map<string, number>()
        const propios = [...runs]
          .filter((r) => r.scenarioId.startsWith(`${seccion.id}/`))
          .sort((a, b) => new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime())
        for (const run of propios) {
          ultimaPorEscenario.set(run.scenarioId, run.durationMs)
        }
        const total = [...ultimaPorEscenario.values()].reduce((suma, ms) => suma + ms, 0)
        setDuracionMs(total)
      })
      .catch(() => {
        // Informativo: sin el tiempo, el cierre se muestra igual.
      })

    return () => {
      cancelled = true
    }
  }, [seccion.id])

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
        Aprobaste <span className="font-semibold text-ink tabular-nums">{progreso.aprobados}</span>{' '}
        de los <span className="tabular-nums">{escenarios.length}</span> escenarios de{' '}
        {seccion.titulo}
        {duracionMs !== null && <> en {formatearDuracion(duracionMs)}</>}. Puedes repetir cualquiera
        cuando quieras.
      </p>

      <div className="mt-5 overflow-x-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.88px] text-muted">
          Lo que distingue a uno de otro
        </p>

        <dl className="mt-3 flex flex-col gap-3">
          {DISCRIMINADORES.map((d) => (
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
                  <span className="font-medium text-success">Legítimo:</span> {d.legitimo}
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

export default CierreModulo
