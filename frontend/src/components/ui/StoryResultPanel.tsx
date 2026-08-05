import EtiquetaAprobacion from './EtiquetaAprobacion'
import type { StoryNode } from '../../hooks/useStoryEngine'
import AccionesFinal from './AccionesFinal'

interface StoryResultPanelProps {
  /** 'phishing/rol-de-pagos'. Lo necesita AccionesFinal para el siguiente. */
  escenarioId: string
  node: StoryNode
  signalsTitle: string
  /** Llevan negritas <b>; es contenido fijo del código, nunca de un usuario. */
  signals: string[]
  rule: string
  restartLabel: string
  onRestart: () => void
}

function StoryResultPanel({
  escenarioId,
  node,
  signalsTitle,
  signals,
  rule,
  restartLabel,
  onRestart,
}: StoryResultPanelProps) {
  // 'partial' no es un fallo: una respuesta prudente pero incompleta no puede
  // verse igual que haber entregado la clave.
  const tono =
    node.kind === 'good'
      ? { borde: 'border-success/40', fondo: 'bg-success', icono: '✓' }
      : node.kind === 'partial'
        ? { borde: 'border-warning/40', fondo: 'bg-warning', icono: '!' }
        : { borde: 'border-danger/40', fondo: 'bg-danger', icono: '✕' }

  return (
    <div className={`rounded-lg border bg-surface p-5 ${tono.borde}`}>
      <p className="flex items-center gap-2 text-base font-semibold text-ink">
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-full text-sm text-white ${tono.fondo}`}
          aria-hidden
        >
          {tono.icono}
        </span>
        {node.verdict}
      </p>

      <p className="mt-3 text-base leading-relaxed text-body">{node.outcome}</p>

      <EtiquetaAprobacion node={node} />

      <div className="mt-5 rounded-md bg-canvas-soft p-4">
        <h4 className="text-sm font-semibold text-ink">{signalsTitle}</h4>
        <ul className="mt-3 grid gap-2">
          {signals.map((signal) => (
            <li key={signal} className="flex gap-2 text-base leading-relaxed text-body">
              <span aria-hidden className="text-muted">
                •
              </span>
              <span dangerouslySetInnerHTML={{ __html: signal }} />
            </li>
          ))}
        </ul>
        <p
          className="mt-4 border-t border-hairline-strong pt-3 text-base leading-relaxed text-ink"
          dangerouslySetInnerHTML={{ __html: rule }}
        />
      </div>

      <AccionesFinal
        escenarioId={escenarioId}
        onRestart={onRestart}
        restartLabel={restartLabel}
      />
    </div>
  )
}

export default StoryResultPanel
