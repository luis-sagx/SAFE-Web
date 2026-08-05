import { useEffect, useRef, useState } from 'react'
import AccionesFinal from './AccionesFinal'
import EtiquetaAprobacion from './EtiquetaAprobacion'
import type { StoryNode } from '../../hooks/useStoryEngine'

export interface Senal {
  id: string
  /** Lleva negritas <b>; contenido fijo del código, nunca de un usuario. */
  texto: string
  /** `data-signal` a buscar dentro del contenedor de la pantalla. Si no se
   *  da, o el escenario no está mostrando esa pantalla ahora mismo, la señal
   *  se explica igual — solo que sin resaltar nada. */
  targetId?: string
}

interface PanelVeredictoProps {
  /** 'phishing/factura-sri'. Lo necesita AccionesFinal para el siguiente. */
  escenarioId: string
  node: StoryNode
  senales: Senal[]
  /** Lleva negritas <b>; contenido fijo del código. */
  regla: string
  restartLabel: string
  onRestart: () => void
  /** id del contenedor de la pantalla (ver EscenarioLayout), para ubicar el
   *  elemento que corresponde a cada señal. */
  contenedorId: string
}

const CLASE_RESALTADA = 'senal-resaltada'

/**
 * Reemplaza a StoryResultPanel para los escenarios interactivos: primero el
 * veredicto, después un recorrido de las señales que resalta el elemento real
 * en la pantalla en vez de listarlas aparte, y cierra con la regla de oro.
 */
function PanelVeredicto({
  escenarioId,
  node,
  senales,
  regla,
  restartLabel,
  onRestart,
  contenedorId,
}: PanelVeredictoProps) {
  const haySenales = senales.length > 0

  // -1 = veredicto todavía sin abrir el recorrido, 0..N-1 = viendo esa señal,
  // N = cierre. Sin señales no hay recorrido que abrir: se arranca ya en el
  // cierre para que siempre haya un botón visible que avance algo.
  const [paso, setPaso] = useState(haySenales ? -1 : 0)

  const enVeredicto = paso === -1
  const enSenal = haySenales && paso >= 0 && paso < senales.length
  const enCierre = !enVeredicto && !enSenal

  const primerBotonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    primerBotonRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!enSenal) {
      return
    }

    const targetId = senales[paso]?.targetId
    if (!targetId) {
      return
    }

    const contenedor = document.getElementById(contenedorId)
    const elemento = contenedor?.querySelector<HTMLElement>(`[data-signal="${targetId}"]`)
    if (!elemento) {
      return
    }

    elemento.classList.add(CLASE_RESALTADA)
    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' })

    return () => elemento.classList.remove(CLASE_RESALTADA)
  }, [enSenal, paso, senales, contenedorId])

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

      {enVeredicto && (
        <button
          ref={primerBotonRef}
          type="button"
          className="mt-5 min-h-11 w-full rounded-md border border-hairline-strong bg-surface px-4 py-3 text-base font-medium text-ink transition hover:bg-canvas-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          onClick={() => setPaso(0)}
        >
          Ver las señales
        </button>
      )}

      {enSenal && (
        <div className="mt-5 rounded-md bg-canvas-soft p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-ink">
              Señal {paso + 1} de {senales.length}
            </h4>
            <button
              type="button"
              className="text-sm font-medium text-link underline"
              onClick={() => setPaso(senales.length)}
            >
              Saltar
            </button>
          </div>
          <p
            className="mt-3 text-base leading-relaxed text-body"
            dangerouslySetInnerHTML={{ __html: senales[paso]?.texto ?? '' }}
          />
          <div className="mt-4 flex gap-2">
            {paso > 0 && (
              <button
                type="button"
                className="h-11 flex-1 rounded-md border border-hairline-strong bg-surface text-sm font-medium text-ink transition hover:bg-canvas-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                onClick={() => setPaso((p) => p - 1)}
              >
                ← Anterior
              </button>
            )}
            <button
              type="button"
              className="h-11 flex-1 rounded-md bg-primary text-sm font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
              onClick={() => setPaso((p) => p + 1)}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {enCierre && (
        <>
          <div className="mt-5 rounded-md bg-canvas-soft p-4">
            <p
              className="text-base leading-relaxed text-ink"
              dangerouslySetInnerHTML={{ __html: regla }}
            />
          </div>

          <AccionesFinal
            escenarioId={escenarioId}
            onRestart={onRestart}
            restartLabel={restartLabel}
            autoFocus={!haySenales}
          />
        </>
      )}
    </div>
  )
}

export default PanelVeredicto
