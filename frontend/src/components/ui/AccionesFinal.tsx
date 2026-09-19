import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { getSectionScenarios, getSection, getScenarioPath, SECTIONS } from '../../data/catalogo'
import { fetchProgress } from '../../lib/api'
import type { RunOutcome } from '../../lib/api'
import { withAttemptedScenario, nextInRound } from '../../lib/bloqueoEscenarios'
import ModuleQuiz from '../MiniTestModulo'
import ModuleTransition from '../TransicionModulo'

interface FinalActionsProps {
  escenarioId: string
  // outcome puede llegar antes de que el servidor guarde la corrida.
  outcome: RunOutcome
  // Se conservan temporalmente porque PanelVeredicto los entrega desde cada
  // escenario, pero ya no se muestran acciones de reinicio en este cierre.
  onRestart?: () => void
  restartLabel?: string
  autoFocus?: boolean
}

// Mientras queden escenarios sin intentar, la acción principal es "siguiente".
// Reiniciar siempre crea una ronda nueva desde cero; no permite reintentos sueltos.
function FinalActions({ escenarioId: scenarioId, outcome, autoFocus }: FinalActionsProps) {
  const location = useLocation()
  const sectionId = scenarioId.split('/')[0] ?? ''
  const scenarios = getSectionScenarios(sectionId)
  const nextModule = SECTIONS[SECTIONS.findIndex((section) => section.id === sectionId) + 1]

  // null mientras no se sabe: hasta que llegue el progreso se usa el orden del
  // catálogo, que da un "siguiente" razonable sin dejar la pantalla en blanco.
  const [attempted, setAttempted] = useState<Set<string> | null>(null)
  const [progress, setProgress] = useState<import('../../lib/api').Progress | null>(null)
  const [showTransition, setShowTransition] = useState(true)
  const [quizPassed, setQuizPassed] = useState(false)
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

  // Umbral ya superado con este último intento, no `progress.aprobado`: ese
  // valor es el que trajo el GET previo y todavía no cuenta el escenario que
  // se acaba de terminar (issue #229 — sin esto, la pantalla de transición no
  // aparecía justo en el intento que aprueba el módulo, que es el momento
  // donde más falta hace).
  const justApproved = progress != null && effectiveApprovedCount >= progress.requeridos
  const currentSection = getSection(sectionId)

  return (
    <>
      {/* Mini-test antes de la transición (issue #230): dos preguntas sobre
          el tipo de engaño del módulo, hay que acertarlas para pasar a la
          pantalla de "siguiente módulo" — no es un aviso que se pueda
          saltar, es la condición para avanzar. */}
      {justApproved && nextModule && !quizPassed && (
        <ModuleQuiz seccionId={sectionId} onComplete={() => setQuizPassed(true)} />
      )}
      {/* Pantalla aparte y no un aviso metido en el propio veredicto (issue
          #229): así se nota el "cambio de escena" al pasar de un tipo de
          ataque a otro, en vez de que la transición se sienta continua. */}
      {justApproved && nextModule && currentSection && quizPassed && showTransition && (
        <ModuleTransition
          seccion={currentSection}
          aprobados={effectiveApprovedCount}
          total={scenarios.length}
          siguiente={nextModule}
          onClose={() => setShowTransition(false)}
        />
      )}
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
      {back}
    </>
  )
}

export default FinalActions
