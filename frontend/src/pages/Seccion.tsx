import { ArrowRight, LockKeyhole, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import AppHeader, { BACK_CLASS } from '../components/AppHeader'
import ProgressBar from '../components/BarraProgreso'
import Ticket, { Notches, Sello } from '../components/Boleto'
import ModuleCompletionModal from '../components/CierreModuloModal'
import {
  getSectionScenarios,
  getSection,
  getScenarioPath,
  SECTIONS,
  type Section,
} from '../data/catalogo'
import { fetchProgress, restartModule, type Progress } from '../lib/api'
import { isScenarioAvailable } from '../lib/bloqueoEscenarios'
import ConfirmReplayModal from '../components/ConfirmarRepeticionModal'

// La dificultad no delata naturaleza (un legítimo puede ser tan difícil como uno de fraude). Estrellas + nombre para que
// se lea como escala a simple vista; ámbar y no `ink` para no confundir con el color del título.
const DIFFICULTY_NAME = ['Fácil', 'Fácil', 'Media', 'Difícil', 'Difícil'] as const
const DIFFICULTY_STARS = [1, 1, 2, 3, 3] as const

/** Folio del módulo en el índice de la portada: MOD-01…MOD-07. */
const moduleFolio = (sectionId: string) =>
  `MOD-${String(SECTIONS.findIndex((s) => s.id === sectionId) + 1).padStart(2, '0')}`

function Difficulty({ nivel: level }: { nivel: number }) {
  const name = DIFFICULTY_NAME[level - 1] ?? 'Media'
  const full = DIFFICULTY_STARS[level - 1] ?? 2

  return (
    <span className="inline-flex items-center gap-1.5" title={`Dificultad: ${name}`}>
      <span className="inline-flex items-center gap-px">
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            aria-hidden
            className={`size-3 ${i <= full ? 'fill-current text-warning' : 'text-ticket-edge'}`}
            strokeWidth={1.75}
          />
        ))}
      </span>
      <span>{name}</span>
    </span>
  )
}

// El umbral lo calcula el servidor (THRESHOLDS), no aquí, para no mentir si cambia; "desbloqueado" y "módulo existe"
// son dos condiciones distintas porque el participante solo puede actuar sobre la primera.
function NextModule({
  seccion: section,
  progreso: progress,
}: {
  seccion: Section
  progreso: Progress | null
}) {
  const next = SECTIONS[SECTIONS.findIndex((s) => s.id === section.id) + 1]
  // Sin progreso cargado no se sabe si está abierto, y una tarjeta que dice
  // "bloqueado" y se corrige sola un segundo después miente en el intervalo.
  if (!next || !progress) return null

  // Avanzar exige ver todos los escenarios del módulo anterior, no una nota mínima; la nota es solo para el certificado.
  const open = progress.escenarios.length >= getSectionScenarios(section.id).length
  const ready = getSectionScenarios(next.id).length > 0
  const missing = Math.max(getSectionScenarios(section.id).length - progress.escenarios.length, 0)
  const Icon = next.Icono

  const status = !open
    ? `Se abre al completar todos los escenarios de ${section.titulo}. Te ${missing === 1 ? 'falta' : 'faltan'} ${missing}.`
    : ready
      ? next.descripcion
      : 'Ya lo desbloqueaste. Estamos preparando sus escenarios.'

  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-sm uppercase tracking-[0.14em] text-muted">
          {open ? (
            <Icon
              aria-hidden
              className={`size-4 shrink-0 ${ready ? 'text-link' : 'text-muted'}`}
              strokeWidth={1.75}
            />
          ) : (
            <LockKeyhole aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
          )}
          <span className="text-ink">{moduleFolio(next.id)}</span>
          <span>Siguiente módulo</span>
        </p>
        <h2 className="mt-2 font-display text-2xl uppercase tracking-[0.02em] text-ink underline-offset-4 group-hover:underline sm:text-3xl">
          {next.titulo}
        </h2>
        <p className="mt-2 max-w-prose text-base leading-relaxed text-body">{status}</p>
      </div>

      {open && !ready && (
        <div className="shrink-0">
          <Sello>Pronto</Sello>
        </div>
      )}
      {open && ready && (
        <span
          aria-hidden
          className="inline-flex shrink-0 items-center gap-1.5 font-mono text-sm uppercase tracking-[0.14em] text-link transition group-hover:translate-x-0.5"
        >
          Continuar
          <ArrowRight className="size-4" strokeWidth={2} />
        </span>
      )}
    </>
  )

  // Un boleto aparte y no otra fila de la tira: es el paso siguiente del
  // recorrido, no un escenario más de este módulo.
  const rowClassName = 'flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:gap-8'

  return (
    <Ticket className="mt-8 overflow-hidden">
      {open && ready ? (
        <Link
          to={`/seccion/${next.id}`}
          className={`group ${rowClassName} transition hover:bg-ticket-edge/30 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-link`}
        >
          {content}
        </Link>
      ) : (
        <div className={`${rowClassName} bg-ticket-edge/15`}>{content}</div>
      )}
    </Ticket>
  )
}

function Section() {
  const { seccionId: sectionId } = useParams()
  const section = getSection(sectionId)
  const selectedSectionId = section?.id
  const [progress, setProgress] = useState<Progress | null>(null)
  const [showCompletion, setShowCompletion] = useState(false)
  const [showReplay, setShowReplay] = useState(false)
  const [restarting, setRestarting] = useState(false)
  const [restartError, setRestartError] = useState<string | null>(null)

  // getSection() devuelve un objeto nuevo en cada render; usamos su id estable.
  useEffect(() => {
    // Una sección sin escenarios no tiene gating configurado en el backend:
    // pedirlo solo daría un 404 esperado.
    if (!selectedSectionId || getSectionScenarios(selectedSectionId).length === 0) return
    let cancelled = false

    fetchProgress(selectedSectionId)
      .then((p) => {
        if (!cancelled) setProgress(p)
      })
      .catch(() => {
        // El progreso es informativo: si no carga, la sección sigue usable.
      })

    return () => {
      cancelled = true
    }
  }, [selectedSectionId])

  if (!section) {
    return <Navigate to="/dashboard" replace />
  }

  const scenarios = getSectionScenarios(section.id)
  const missing = progress ? Math.max(progress.requeridos - progress.aprobados, 0) : 0
  const replayable = progress && (progress.escenarios.length > 0 || progress.rondaEnCurso != null)

  async function confirmRestart() {
    if (restarting || !selectedSectionId) return
    setRestarting(true)
    setRestartError(null)
    try {
      const restarted = await restartModule(selectedSectionId)
      setProgress(restarted)
      setShowReplay(false)
      setShowCompletion(false)
    } catch {
      setRestartError('No se pudo reiniciar el módulo. Inténtalo de nuevo.')
    } finally {
      setRestarting(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader
        atras={
          <Link to="/dashboard" className={BACK_CLASS}>
            ← Volver
          </Link>
        }
      />

      {/* Mismo ancho que dashboard y barra superior: las tres pantallas se leen como una sola, sin saltos al entrar. */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* El folio del módulo, no un rótulo repetido: dice en qué número del
            recorrido estás y dónde ocurre la amenaza, que el título no dice. */}
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-base uppercase tracking-[0.12em] text-muted">
          <section.Icono aria-hidden className="size-4 shrink-0 text-link" strokeWidth={2} />
          <span className="text-ink">{moduleFolio(section.id)}</span>
          <span>{section.canal}</span>
        </p>

        <h1 className="mt-2 font-display text-4xl uppercase tracking-[0.01em] text-ink sm:text-5xl">
          {section.titulo}
        </h1>
        <p className="mt-3 max-w-prose text-lg leading-relaxed text-body">{section.descripcion}</p>

        {scenarios.length === 0 ? (
          <Ticket className="mt-10">
            <p className="px-6 py-8 text-base leading-relaxed text-body">
              Estamos preparando los escenarios de esta sección.
            </p>
          </Ticket>
        ) : (
          // La tira del módulo: cabecera con el avance, un escenario por fila en
          // el orden en que se abren, y el talón para volver a empezar.
          <Ticket
            className="mt-8 overflow-hidden"
            talon={
              replayable ? (
                <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-base leading-relaxed text-body">
                    Puedes volver a empezar este módulo desde el escenario 01.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setRestartError(null)
                      setShowReplay(true)
                    }}
                    className="min-h-11 shrink-0 rounded-md bg-primary px-4 font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                  >
                    Repetir el módulo
                  </button>
                </div>
              ) : undefined
            }
          >
            {/* Avance arriba del todo: es lo primero que se busca al volver a la sección. */}
            {progress && (
              <section
                aria-labelledby="titulo-progreso"
                className="relative border-b border-dashed border-ticket-edge px-6 py-5"
              >
                <Notches className="-bottom-2.5" />
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <h2
                    id="titulo-progreso"
                    className="font-mono text-base uppercase tracking-[0.12em] text-ink"
                  >
                    Progreso del módulo
                  </h2>
                  {/* El umbral no se repite en texto: ya lo marca el anillo de la barra (BarraProgreso). */}
                  <p className="font-mono text-base uppercase tracking-[0.12em] text-muted">
                    <span className="text-xl text-ink tabular-nums">{progress.aprobados}</span>
                    <span>/{scenarios.length}</span> escenarios aprobados
                  </p>
                </div>

                <ProgressBar
                  className="mt-4"
                  aprobados={progress.aprobados}
                  total={scenarios.length}
                  requeridos={progress.requeridos}
                  aprobado={progress.aprobado}
                  etiqueta={`Avance de ${section.titulo}`}
                />

                {progress.rondaEnCurso && (
                  <p className="mt-3 text-base leading-relaxed text-body">
                    Repetición en curso: {progress.rondaEnCurso.jugados}/{scenarios.length}. Tu nota
                    se mantiene en {progress.aprobados}/{scenarios.length} hasta que termines los{' '}
                    {scenarios.length} de esta repetición.
                  </p>
                )}

                {progress.aprobado ? (
                  // Resumen completo vive en el modal, no aquí: siempre visible competía con los escenarios.
                  <button
                    type="button"
                    onClick={() => setShowCompletion(true)}
                    className="mt-3 min-h-11 text-base font-medium text-link underline"
                  >
                    Ver resumen del módulo
                  </button>
                ) : (
                  <p className="mt-3 text-base text-body">
                    {`Te ${missing === 1 ? 'falta' : 'faltan'} ${missing} para aprobar el módulo.`}
                  </p>
                )}
              </section>
            )}

            <ol>
              {scenarios.map((scenario, index) => {
                // "Sin jugar" y no otra insignia antes de jugar: delataría si es fraude o legítimo. La ronda en curso solo
                // actualiza los escenarios ya rejugados esta vez; los demás mantienen su resultado previo (si no, repetir
                // uno apagaba la insignia de los otros).
                const inCurrentRound = progress?.rondaEnCurso?.escenarios.find(
                  (e) => e.id === scenario.id,
                )
                const latest = inCurrentRound
                  ? inCurrentRound.ultimoOutcome
                  : progress?.escenarios.find((e) => e.id === scenario.id)?.ultimoOutcome
                const approved = latest === 'CORRECTO'
                const available = isScenarioAvailable(scenarios, progress, scenario.id)

                const content = (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-sm uppercase tracking-[0.14em] text-muted">
                        <span className={approved ? 'text-success-ink' : 'text-ink'}>
                          ESC-{String(index + 1).padStart(2, '0')}
                        </span>
                        <Difficulty nivel={scenario.dificultad} />
                      </p>
                      <h3 className="mt-1.5 font-display text-2xl uppercase tracking-[0.02em] text-ink underline-offset-4 group-hover:underline">
                        {scenario.titulo}
                      </h3>
                      <p className="mt-1.5 max-w-prose text-base leading-relaxed text-body">
                        {scenario.descripcion}
                      </p>
                    </div>

                    <div className="shrink-0 sm:w-52">
                      {approved && <Sello tono="border-success-ink text-success-ink">Aprobado</Sello>}
                      {!approved && latest !== undefined && (
                        <Sello tono="border-danger text-danger">Sin aprobar</Sello>
                      )}
                      {!approved && latest === undefined && available && (
                        <span className="font-mono text-sm uppercase tracking-[0.14em] text-muted">
                          Sin jugar
                        </span>
                      )}
                      {!approved && latest === undefined && !available && (
                        /* El candado señala el escenario anterior en la lista, no el próximo pendiente del módulo: cada
                           uno depende del de al lado, no de un número fijo. */
                        <span className="inline-flex items-start gap-2 font-mono text-sm uppercase leading-relaxed tracking-[0.14em] text-muted">
                          <LockKeyhole aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
                          Se abre al terminar el {String(index).padStart(2, '0')}
                        </span>
                      )}

                      {available && (
                        <span
                          aria-hidden
                          className="mt-2 block font-mono text-sm uppercase tracking-[0.14em] text-link transition group-hover:translate-x-0.5"
                        >
                          {progress?.rondaEnCurso ? 'Continuar →' : 'Empezar →'}
                        </span>
                      )}
                    </div>
                  </>
                )

                const rowClassName =
                  'flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:gap-8'

                return (
                  <li
                    key={scenario.id}
                    className={`relative ${index > 0 ? 'border-t border-dashed border-ticket-edge' : ''}`}
                  >
                    {index > 0 && <Notches className="-top-2.5" />}

                    {/* Lo bloqueado se distingue por el candado y el papel entintado, nunca por opacidad:
                        bajarla dejaría el texto por debajo del contraste mínimo. */}
                    {available ? (
                      <Link
                        to={getScenarioPath(scenario)}
                        className={`group ${rowClassName} transition hover:bg-ticket-edge/30 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-link`}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className={`${rowClassName} bg-ticket-edge/15`} aria-disabled="true">
                        {content}
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          </Ticket>
        )}

        {showReplay && progress && (
          <ConfirmReplayModal
            titulo={section.titulo}
            aprobados={progress.aprobados}
            total={scenarios.length}
            busy={restarting}
            error={restartError}
            onClose={() => setShowReplay(false)}
            onConfirm={confirmRestart}
          />
        )}

        {showCompletion && progress?.aprobado && (
          <ModuleCompletionModal
            seccion={section}
            escenarios={scenarios}
            progreso={progress}
            onClose={() => setShowCompletion(false)}
          />
        )}

        <NextModule seccion={section} progreso={progress} />
      </main>
    </div>
  )
}

export default Section
