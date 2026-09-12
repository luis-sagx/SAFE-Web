import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { getSectionScenarios, getSection, getScenarioPath, SECTIONS } from '../../data/catalogo'
import { fetchProgress } from '../../lib/api'
import type { RunOutcome } from '../../lib/api'
import { withAttemptedScenario, nextInRound } from '../../lib/bloqueoEscenarios'
import ConfirmReplayModal from '../ConfirmarRepeticionModal'

interface FinalActionsProps {
  escenarioId: string
  // outcome puede llegar antes de que el servidor guarde la corrida.
  outcome: RunOutcome
  onRestart?: () => void
  restartLabel?: string
  autoFocus?: boolean
}

// Mientras queden escenarios sin intentar, la acción principal es "siguiente",
// no repetir: repetir de entrada infla el resultado con reintentos en vez de
// medir lo que la persona sabía (el gating cuenta el último intento).
function FinalActions({ escenarioId: scenarioId, outcome, autoFocus }: FinalActionsProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const sectionId = scenarioId.split('/')[0] ?? ''
  const scenarios = getSectionScenarios(sectionId)
  const nextModule = SECTIONS[SECTIONS.findIndex((section) => section.id === sectionId) + 1]

  // null mientras no se sabe: hasta que llegue el progreso se usa el orden del
  // catálogo, que da un "siguiente" razonable sin dejar la pantalla en blanco.
  const [attempted, setAttempted] = useState<Set<string> | null>(null)
  // Cuántos van aprobados contra el umbral. Es el dato que convierte un
  // escenario suelto en avance de un curso, y el momento de decirlo es
  // justo después del veredicto.
  const [showReplay, setShowReplay] = useState(false)
  const [progress, setProgress] = useState<import('../../lib/api').Progress | null>(null)
  const mainRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null)

  useEffect(() => {
    if (scenarios.length === 0) return
    let cancelled = false

    fetchProgress(sectionId)
      .then((progress) => {
        if (cancelled) return
        // Se añade a mano: la corrida se guarda en paralelo y este progreso
        // puede haberse pedido antes de que el servidor la registre.
        setAttempted(new Set([...progress.escenarios.map((e) => e.id), scenarioId]))
        setProgress(progress)
      })
      .catch(() => {
        // Sin progreso se sigue con el orden del catálogo, para no dejar al
        // participante sin ningún botón por un fallo de red.
      })

    return () => {
      cancelled = true
    }
  }, [sectionId, scenarioId])

  useEffect(() => {
    if (autoFocus) mainRef.current?.focus()
  }, [autoFocus])

  const currentIndex = scenarios.findIndex((e) => e.id === scenarioId)
  const navigationState = location.state as {
    iniciarRepeticion?: boolean
    repeticionIntentados?: { id: string; outcome: RunOutcome }[]
  } | null
  const replaying = navigationState?.iniciarRepeticion === true
  const replayAttempts = navigationState?.repeticionIntentados ?? []
  const progressBeforeCurrent = progress && replaying
    ? replayAttempts.reduce(
        (current, attempt) => withAttemptedScenario(current, attempt.id, attempt.outcome, true),
        progress,
      )
    : progress
  const effectiveProgress = progress
    ? withAttemptedScenario(progressBeforeCurrent!, scenarioId, outcome, replaying)
    : null
  const pendingResults = effectiveProgress?.rondaEnCurso?.escenarios ?? effectiveProgress?.escenarios ?? []
  const effectiveApprovedCount = pendingResults.filter((result) => result.ultimoOutcome === 'CORRECTO').length
  const effectiveApproved = effectiveProgress
    ? effectiveApprovedCount >= effectiveProgress.requeridos && pendingResults.length >= scenarios.length
    : false
  const next = effectiveProgress
    ? nextInRound(scenarios, effectiveProgress)
    : attempted
      ? scenarios.find((e) => !attempted.has(e.id))
    : scenarios[currentIndex + 1]

  const back = (
    <Link
      to={`/seccion/${sectionId}`}
      className="mt-3 block text-center text-base font-medium text-link underline"
    >
      Volver a la sección
    </Link>
  )

  // Aparece solo cuando el progreso ya llegó (un instante después del veredicto).
  const marker = progress && (
    <p className="mt-4 text-center text-base text-body">
      {(effectiveProgress ? effectiveApprovedCount : progress.aprobados) >= progress.requeridos ? (
        <>
          Llevas <span className="font-semibold text-ink tabular-nums">{effectiveProgress ? effectiveApprovedCount : progress.aprobados}</span>{' '}
          aprobados en este módulo: ya superaste los {progress.requeridos} que hacían falta.
        </>
      ) : (
        <>
          Llevas <span className="font-semibold text-ink tabular-nums">{effectiveProgress ? effectiveApprovedCount : progress.aprobados}</span> de
          los <span className="tabular-nums">{progress.requeridos}</span> que necesitas para aprobar
          el módulo.
        </>
      )}
    </p>
  )

  if (next) {
    const remaining = attempted
      ? scenarios.filter((e) => !attempted.has(e.id)).length
      : null

    return (
      <>
        {marker}
        <Link
          ref={mainRef as React.Ref<HTMLAnchorElement>}
          to={getScenarioPath(next)}
          // El guardado es async: si al navegar el servidor aún no lo registró,
          // la siguiente pantalla vería este escenario "sin intentar" y
          // rebotaría a la sección. `recienCompletado` evita eso.
          state={{
            recienCompletado: scenarioId,
            iniciarRepeticion: replaying || effectiveProgress?.rondaEnCurso != null,
            repeticionIntentados: replaying
              ? [...replayAttempts, { id: scenarioId, outcome }]
              : undefined,
          }}
          className="mt-5 flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-3 text-lg font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
        >
          Siguiente escenario →
        </Link>
        {remaining !== null && (
          <p className="mt-2 text-center text-base text-muted">
            {remaining === 1 ? 'Te queda 1 escenario' : `Te quedan ${remaining} escenarios`} en este
            módulo.
          </p>
        )}
        {back}
      </>
    )
  }

  return (
    <>
      {marker}
      {scenarios.length > 0 && (
        <p className="mt-5 text-center text-base text-body">
          Ya recorriste los {scenarios.length} escenarios del módulo.
        </p>
      )}
      <Link
        ref={mainRef as React.Ref<HTMLAnchorElement>}
        to={nextModule ? `/seccion/${nextModule.id}` : '/dashboard'}
        className="mt-3 flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-lg font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
      >
        {nextModule ? 'Ir al siguiente módulo →' : 'Volver al panel →'}
      </Link>
      {progress && !effectiveApproved && (
        <>
          <p className="mt-4 text-center text-base text-body">
            Aún no alcanzas la nota mínima. Puedes repetir el módulo completo para intentarlo de nuevo.
          </p>
          <button
            type="button"
            className="mt-3 min-h-11 w-full rounded-md border border-hairline-strong px-4 py-3 text-lg font-medium text-body transition hover:bg-surface-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
            onClick={() => setShowReplay(true)}
          >
            Repetir el módulo
          </button>
        </>
      )}
      {showReplay && progress && !effectiveApproved && (
        <ConfirmReplayModal
          seccionId={sectionId}
          titulo={getSection(sectionId)?.titulo ?? sectionId}
          aprobados={effectiveApprovedCount}
          aprobado={effectiveApproved}
          onClose={() => setShowReplay(false)}
          onConfirm={() => scenarios[0] && navigate(getScenarioPath(scenarios[0]), { state: { iniciarRepeticion: true } })}
        />
      )}
      {back}
    </>
  )
}

export default FinalActions
