import { ArrowRight, CheckCircle2, LockKeyhole, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import AppHeader, { BACK_CLASS } from '../components/AppHeader'
import ProgressBar from '../components/BarraProgreso'
import ModuleCompletionModal from '../components/CierreModuloModal'
import {
  getSectionScenarios,
  getSection,
  getScenarioPath,
  SECTIONS,
  type Section,
} from '../data/catalogo'
import { fetchProgress, type Progress } from '../lib/api'
import { isScenarioAvailable } from '../lib/bloqueoEscenarios'
import ConfirmReplayModal from '../components/ConfirmarRepeticionModal'

// La dificultad no delata naturaleza (un legítimo puede ser tan difícil como uno de fraude). Estrellas + nombre para que
// se lea como escala a simple vista; ámbar y no `ink` para no confundir con el color del título.
const DIFFICULTY_NAME = ['Fácil', 'Fácil', 'Media', 'Difícil', 'Difícil'] as const
const DIFFICULTY_STARS = [1, 1, 2, 3, 3] as const

function Difficulty({ nivel: level }: { nivel: number }) {
  const name = DIFFICULTY_NAME[level - 1] ?? 'Media'
  const full = DIFFICULTY_STARS[level - 1] ?? 2

  return (
    <span className="inline-flex items-center gap-1" title={`Dificultad: ${name}`}>
      <span className="inline-flex items-center gap-px">
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            aria-hidden
            className={`size-2.5 ${i <= full ? 'fill-current text-warning' : 'text-hairline-strong'}`}
            strokeWidth={1.75}
          />
        ))}
      </span>
      <span className="text-sm text-muted">{name}</span>
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
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-strong ${
          open && ready ? 'text-link' : 'text-muted'
        }`}
      >
        {open ? (
          <Icon aria-hidden className="size-5" strokeWidth={1.75} />
        ) : (
          <LockKeyhole aria-hidden className="size-5" strokeWidth={1.75} />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.88px] text-muted">
          Siguiente módulo
        </p>
        <h2 className="mt-1 text-lg font-semibold text-ink">{next.titulo}</h2>
        <p className="mt-1 text-base leading-relaxed text-body">{status}</p>
      </div>

      {open && !ready && (
        <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.88px] text-muted">
          Pronto
        </span>
      )}
      {open && ready && (
        <span
          aria-hidden
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-link transition group-hover:translate-x-0.5"
        >
          Continuar
          <ArrowRight className="size-4" strokeWidth={2} />
        </span>
      )}
    </>
  )

  // Franja horizontal y no otra tarjeta: es el paso siguiente del recorrido, no
  // un escenario más de esta lista.
  const className = 'mt-8 flex items-center gap-4 rounded-lg border p-5 transition'

  return open && ready ? (
    <Link
      to={`/seccion/${next.id}`}
      className={`group ${className} border-hairline-strong bg-surface hover:-translate-y-0.5 hover:border-link/40 hover:shadow-card`}
    >
      {content}
    </Link>
  ) : (
    <div className={`${className} border-hairline-strong bg-canvas-soft`}>{content}</div>
  )
}

function Section() {
  const { seccionId: sectionId } = useParams()
  const section = getSection(sectionId)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [showCompletion, setShowCompletion] = useState(false)
  const [showReplay, setShowReplay] = useState(false)
  const navigate = useNavigate()

  // getSeccion() devuelve un objeto nuevo en cada render: la dependencia es
  // seccion?.id, no seccion, para no pedir el progreso de nuevo en cada uno.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Una sección sin escenarios no tiene gating configurado en el backend:
    // pedirlo solo daría un 404 esperado.
    if (!section || getSectionScenarios(section.id).length === 0) return
    let cancelled = false

    fetchProgress(section.id)
      .then((p) => {
        if (!cancelled) setProgress(p)
      })
      .catch(() => {
        // El progreso es informativo: si no carga, la sección sigue usable.
      })

    return () => {
      cancelled = true
    }
  }, [section?.id])

  if (!section) {
    return <Navigate to="/dashboard" replace />
  }

  const scenarios = getSectionScenarios(section.id)
  const missing = progress ? Math.max(progress.requeridos - progress.aprobados, 0) : 0


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
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.88px] text-muted">
          <section.Icono aria-hidden className="size-4 text-link" strokeWidth={2} />
          {section.titulo}
          <span aria-hidden className="text-muted-soft">
            ·
          </span>
          {section.canal}
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">{section.titulo}</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-body">{section.descripcion}</p>

        {/* Avance antes que las tarjetas, ancho completo: es lo primero que se busca al volver a la sección. */}
        {progress && scenarios.length > 0 && (
          <section
            aria-labelledby="titulo-progreso"
            className="mt-8 rounded-lg border border-hairline-strong bg-canvas-soft p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h2
                id="titulo-progreso"
                className="text-xs font-semibold uppercase tracking-[0.88px] text-muted"
              >
                Progreso del módulo
              </h2>
              {/* El umbral no se repite en texto: ya lo marca el anillo de la barra (BarraProgreso). */}
              <p className="text-sm font-medium text-ink">
                <span className="text-lg font-semibold tabular-nums">{progress.aprobados}</span>
                <span className="text-muted">/{scenarios.length}</span>
              </p>
            </div>

            <ProgressBar
              className="mt-3"
              aprobados={progress.aprobados}
              total={scenarios.length}
              requeridos={progress.requeridos}
              aprobado={progress.aprobado}
              etiqueta={`Avance de ${section.titulo}`}
            />

            {progress.rondaEnCurso && (
              <p className="mt-2 text-sm text-muted">Repetición en curso: {progress.rondaEnCurso.jugados}/{scenarios.length}</p>
            )}
            {progress.rondaEnCurso && (
              <p className="mt-2 text-sm text-body">Tu nota se mantiene en {progress.aprobados}/{scenarios.length} hasta que termines los {scenarios.length} de esta repetición.</p>
            )}

            {progress.aprobado ? (
              // Resumen completo vive en el modal, no aquí: siempre visible competía con las tarjetas de escenarios.
              <button
                type="button"
                onClick={() => setShowCompletion(true)}
                className="mt-3 text-sm font-medium text-link underline"
              >
                Ver resumen del módulo
              </button>
            ) : (
              <p className="mt-3 text-sm text-body">
                {`Te ${missing === 1 ? 'falta' : 'faltan'} ${missing} para aprobar el módulo.`}
              </p>
            )}
          </section>
        )}

        {progress && progress.rondaEnCurso === null && progress.escenarios.length >= scenarios.length && (
          <div className="mt-8 flex items-center justify-between rounded-lg border border-hairline-strong bg-canvas-soft p-5">
            <p className="text-base text-body">Ya recorriste todos los escenarios del módulo.</p>
            <button type="button" onClick={() => setShowReplay(true)} className="rounded-md bg-primary px-4 py-2 font-medium text-on-primary">Repetir el módulo</button>
          </div>
        )}

        {showReplay && progress && (
          <ConfirmReplayModal seccionId={section.id} titulo={section.titulo} aprobados={progress.aprobados} aprobado={progress.aprobado} onClose={() => setShowReplay(false)} onConfirm={() => scenarios[0] && navigate(getScenarioPath(scenarios[0]), { state: { iniciarRepeticion: true } })} />
        )}

        {showCompletion && progress?.aprobado && (
          <ModuleCompletionModal
            seccion={section}
            escenarios={scenarios}
            progreso={progress}
            onClose={() => setShowCompletion(false)}
          />
        )}

        {scenarios.length === 0 ? (
          <p className="mt-10 rounded-lg border border-hairline-strong bg-surface p-5 text-base text-body">
            Estamos preparando los escenarios de esta sección.
          </p>
        ) : (
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              const cardClassName = `group flex w-full flex-col rounded-lg border bg-surface p-5 transition ${
                available ? 'hover:-translate-y-0.5 hover:shadow-card' : 'opacity-70'
              } ${
                approved
                  ? 'border-mint-mid hover:border-success/50'
                  : available
                    ? 'border-hairline-strong hover:border-link/40'
                    : 'border-hairline-strong'
              }`
              const content = (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`font-mono text-xs font-medium tabular-nums ${
                        approved ? 'text-success-ink' : 'text-muted'
                      }`}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <Difficulty nivel={scenario.dificultad} />
                  </div>

                  <h3 className="mt-3 text-lg font-semibold text-ink">{scenario.titulo}</h3>
                  <p className="mt-2 flex-1 text-base leading-relaxed text-body">
                    {scenario.descripcion}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3">
                    {approved ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.88px] text-success-ink">
                        <CheckCircle2 aria-hidden className="size-3.5" strokeWidth={2.5} />
                        Aprobado
                      </span>
                    ) : latest !== undefined ? (
                      <span className="text-xs font-semibold uppercase tracking-[0.88px] text-muted">
                        Sin aprobar
                      </span>
                    ) : available ? (
                      <span className="text-xs font-semibold uppercase tracking-[0.88px] text-muted">
                        Sin jugar
                      </span>
                    ) : (
                      /* El candado señala el escenario anterior en la lista, no el próximo pendiente del módulo: cada
                         uno depende del de al lado, no de un número fijo. */
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
                        <LockKeyhole aria-hidden className="size-3.5" strokeWidth={2.5} />
                        Se abre al terminar el {String(index).padStart(2, '0')}
                      </span>
                    )}
                    <span
                      aria-hidden
                      className={`text-sm font-medium transition ${
                        available ? 'text-link group-hover:translate-x-0.5' : 'text-muted'
                      }`}
                    >
                      {available ? (latest !== undefined ? 'Repetir →' : 'Empezar →') : ''}
                    </span>
                  </div>
                </>
              )

              return (
                <li key={scenario.id} className="flex">
                  {available ? (
                    <Link
                      to={getScenarioPath(scenario)}
                      className={cardClassName}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className={cardClassName} aria-disabled="true">
                      {content}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        )}

        <NextModule seccion={section} progreso={progress} />
      </main>
    </div>
  )
}

export default Section
