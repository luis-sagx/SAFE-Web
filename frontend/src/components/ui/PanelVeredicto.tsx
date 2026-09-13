import { useContext, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import FinalActions from './AccionesFinal'
import { ViewedReviewContext } from './repasoVisto'
import ApprovalLabel from './EtiquetaAprobacion'
import type { StoryNode } from '../../hooks/useStoryEngine'
import type { RunStatus } from '../../hooks/useScenarioRun'
import { outcomeFromKind } from '../../hooks/useScenarioRun'

export interface Signal {
  id: string
  /** Lleva negritas <b>; contenido fijo del código, nunca de un usuario. */
  texto: string
  targetId?: string
  /** Nodo del grafo cuya pantalla contiene esta señal: el repaso vuelve a
   *  esa pantalla antes de resaltarla, porque el escenario puede haber
   *  avanzado a otra. */
  pantalla?: string
}

interface VerdictPanelProps {
  escenarioId: string
  node: StoryNode
  senales: Signal[]
  regla: string
  /** @deprecated Se conserva por compatibilidad con escenarios existentes. */
  restartLabel?: string
  /** @deprecated La repetición ahora se inicia a nivel de módulo. */
  onRestart?: () => void
  contenedorId: string
  onPantalla?: (screenId: string | undefined) => void
  /** Si la corrida llegó al servidor; sin esto una corrida encolada por
   *  falta de red se veía igual que una guardada. */
  estadoGuardado?: RunStatus
}

const HIGHLIGHTED_CLASS = 'senal-resaltada'
function VerdictPanel({
  escenarioId: scenarioId,
  node,
  senales: signals,
  regla: rule,
  restartLabel,
  onRestart,
  contenedorId: containerId,
  onPantalla: onScreen,
  estadoGuardado: savedStatus,
}: VerdictPanelProps) {
  const hasSignals = signals.length > 0

  // -1 = veredicto, 0..N-1 = viendo esa señal, N = cierre. Sin señales
  // arranca ya en cierre para que siempre haya un botón que avance algo.
  const [step, setStep] = useState(hasSignals ? -1 : 0)

  // Para reservar el alto del recorrido; se compara sin <b>, que no ocupa pantalla.
  const length = (text: string) => text.replace(/<[^>]+>/g, '').length
  const longest = signals.reduce(
    (greater, signal) => (length(signal.texto) > length(greater) ? signal.texto : greater),
    '',
  )

  const showingVerdict = step === -1
  const showingSignal = hasSignals && step >= 0 && step < signals.length
  const completing = !showingVerdict && !showingSignal

  const firstButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    firstButtonRef.current?.focus()
  }, [])

  // Avisa al layout cuando no queda repaso pendiente para que "Salir" no advierta nada.
  const markReviewAsViewed = useContext(ViewedReviewContext)
  useEffect(() => {
    if (completing) markReviewAsViewed?.(true)
  }, [completing, markReviewAsViewed])

  useEffect(() => {
    const id = `run-status-${scenarioId}`

    if (savedStatus === 'queued') {
      toast.warning('No pudimos enviar el intento.', {
        id,
        description:
          'Quedó guardado en este equipo y lo reintentaremos automáticamente.',
      })
    }

    if (savedStatus === 'failed') {
      toast.error('No se pudo registrar este intento.', {
        id,
        description: 'El intento fue rechazado y no volverá a enviarse automáticamente.',
      })
    }
  }, [scenarioId, savedStatus])

  useEffect(() => {
    onScreen?.(showingSignal ? signals[step]?.pantalla : undefined)
  }, [showingSignal, step, signals, onScreen])

  useEffect(() => {
    if (!showingSignal) {
      return
    }

    const targetId = signals[step]?.targetId
    if (!targetId) {
      return
    }

    let highlighted: HTMLElement | null = null

    // Reintenta un cuadro después: la pantalla puede seguir montándose cuando corre este efecto.
    function highlight() {
      const container = document.getElementById(containerId)
      const element = container?.querySelector<HTMLElement>(`[data-signal="${targetId}"]`)
      if (!element) {
        return false
      }
      highlighted = element
      element.classList.add(HIGHLIGHTED_CLASS)
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return true
    }

    const id = highlight() ? 0 : window.setTimeout(highlight, 60)

    return () => {
      if (id) window.clearTimeout(id)
      highlighted?.classList.remove(HIGHLIGHTED_CLASS)
    }
  }, [showingSignal, step, signals, containerId])

  // 'partial' no es un fallo: no puede verse igual que haber entregado la clave.
  const tone =
    node.kind === 'good'
      ? { borde: 'border-success/40', fondo: 'bg-success', tinta: 'text-on-success', icono: '✓' }
      : node.kind === 'partial'
        ? { borde: 'border-warning/40', fondo: 'bg-warning', tinta: 'text-on-warning', icono: '!' }
        : { borde: 'border-danger/40', fondo: 'bg-danger', tinta: 'text-on-danger', icono: '✕' }

  return (
    <div className={`rounded-lg border bg-surface p-4 ${tone.borde}`}>
      <p className="flex items-center gap-2 text-lg font-semibold text-ink">
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-full text-sm ${tone.tinta} ${tone.fondo}`}
          aria-hidden
        >
          {tone.icono}
        </span>
        {node.verdict}
      </p>
      <p className="mt-2 text-base leading-relaxed text-body">{node.outcome}</p>

      <ApprovalLabel node={node} />

      {showingVerdict && (
        <button
          ref={firstButtonRef}
          type="button"
          className="mt-5 min-h-12 w-full rounded-md border border-hairline-strong bg-surface px-4 py-3 text-lg font-medium text-ink transition hover:bg-canvas-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          onClick={() => setStep(0)}
        >
          Ver las señales
        </button>
      )}

      {showingSignal && (
        <div
          role="region"
          aria-label="Repaso de señales"
          className="mt-4 rounded-md border border-signal-border bg-signal p-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-ink">
              Señal {step + 1} de {signals.length}
            </h4>
            <button
              type="button"
              className="text-base font-medium text-link underline"
              onClick={() => setStep(signals.length)}
            >
              Saltar
            </button>
          </div>
          {/* Alto reservado con la señal más larga (invisible, debajo) para que
              los botones no salten de posición entre pasos. */}
          <div className="relative mt-3">
            <p
              aria-hidden
              className="invisible text-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: longest }}
            />
            <p
              className="absolute inset-0 text-lg leading-relaxed text-signal-body"
              dangerouslySetInnerHTML={{ __html: signals[step]?.texto ?? '' }}
            />
          </div>
          {/* "Anterior" se renderiza siempre (deshabilitado en el primer paso)
              para que "Siguiente" no se desplace entre pasos. */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={step === 0}
              className="h-12 flex-1 rounded-md border border-hairline-strong bg-surface text-base font-medium text-ink transition hover:bg-canvas-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:cursor-default disabled:border-hairline disabled:text-muted-soft disabled:hover:bg-surface"
              onClick={() => setStep((p) => p - 1)}
            >
              ← Anterior
            </button>
            <button
              type="button"
              className="h-12 flex-1 rounded-md bg-primary text-base font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
              onClick={() => setStep((p) => p + 1)}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {completing && (
        <>
          <div className="mt-5 rounded-md bg-canvas-soft p-4">
            <p
              className="text-lg leading-relaxed text-ink"
              dangerouslySetInnerHTML={{ __html: rule }}
            />
          </div>

          <FinalActions
            escenarioId={scenarioId}
            outcome={node.resultado ?? outcomeFromKind(node.kind)}
            onRestart={onRestart}
            restartLabel={restartLabel}
            autoFocus={!hasSignals}
          />
        </>
      )}
    </div>
  )
}

export default VerdictPanel
