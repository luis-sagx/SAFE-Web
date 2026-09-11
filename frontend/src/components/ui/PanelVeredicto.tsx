import { useContext, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import AccionesFinal from './AccionesFinal'
import { RepasoVistoContext } from './repasoVisto'
import EtiquetaAprobacion from './EtiquetaAprobacion'
import type { StoryNode } from '../../hooks/useStoryEngine'
import type { RunStatus } from '../../hooks/useScenarioRun'
import { outcomeFromKind } from '../../hooks/useScenarioRun'

export interface Senal {
  id: string
  /** Lleva negritas <b>; contenido fijo del código, nunca de un usuario. */
  texto: string
  targetId?: string
  /** Nodo del grafo cuya pantalla contiene esta señal: el repaso vuelve a
   *  esa pantalla antes de resaltarla, porque el escenario puede haber
   *  avanzado a otra. */
  pantalla?: string
}

interface PanelVeredictoProps {
  escenarioId: string
  node: StoryNode
  senales: Senal[]
  regla: string
  /** @deprecated Se conserva por compatibilidad con escenarios existentes. */
  restartLabel?: string
  /** @deprecated La repetición ahora se inicia a nivel de módulo. */
  onRestart?: () => void
  contenedorId: string
  onPantalla?: (pantallaId: string | undefined) => void
  /** Si la corrida llegó al servidor; sin esto una corrida encolada por
   *  falta de red se veía igual que una guardada. */
  estadoGuardado?: RunStatus
}

const CLASE_RESALTADA = 'senal-resaltada'
function PanelVeredicto({
  escenarioId,
  node,
  senales,
  regla,
  restartLabel,
  onRestart,
  contenedorId,
  onPantalla,
  estadoGuardado,
}: PanelVeredictoProps) {
  const haySenales = senales.length > 0

  // -1 = veredicto, 0..N-1 = viendo esa señal, N = cierre. Sin señales
  // arranca ya en cierre para que siempre haya un botón que avance algo.
  const [paso, setPaso] = useState(haySenales ? -1 : 0)

  // Para reservar el alto del recorrido; se compara sin <b>, que no ocupa pantalla.
  const largo = (texto: string) => texto.replace(/<[^>]+>/g, '').length
  const masLarga = senales.reduce(
    (mayor, senal) => (largo(senal.texto) > largo(mayor) ? senal.texto : mayor),
    '',
  )

  const enVeredicto = paso === -1
  const enSenal = haySenales && paso >= 0 && paso < senales.length
  const enCierre = !enVeredicto && !enSenal

  const primerBotonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    primerBotonRef.current?.focus()
  }, [])

  // Avisa al layout cuando no queda repaso pendiente para que "Salir" no advierta nada.
  const avisarRepasoVisto = useContext(RepasoVistoContext)
  useEffect(() => {
    if (enCierre) avisarRepasoVisto?.(true)
  }, [enCierre, avisarRepasoVisto])

  useEffect(() => {
    const id = `run-status-${escenarioId}`

    if (estadoGuardado === 'queued') {
      toast.warning('No pudimos enviar el intento.', {
        id,
        description:
          'Quedó guardado en este equipo y lo reintentaremos automáticamente.',
      })
    }

    if (estadoGuardado === 'failed') {
      toast.error('No se pudo registrar este intento.', {
        id,
        description: 'El intento fue rechazado y no volverá a enviarse automáticamente.',
      })
    }
  }, [escenarioId, estadoGuardado])

  useEffect(() => {
    onPantalla?.(enSenal ? senales[paso]?.pantalla : undefined)
  }, [enSenal, paso, senales, onPantalla])

  useEffect(() => {
    if (!enSenal) {
      return
    }

    const targetId = senales[paso]?.targetId
    if (!targetId) {
      return
    }

    let resaltado: HTMLElement | null = null

    // Reintenta un cuadro después: la pantalla puede seguir montándose cuando corre este efecto.
    function resaltar() {
      const contenedor = document.getElementById(contenedorId)
      const elemento = contenedor?.querySelector<HTMLElement>(`[data-signal="${targetId}"]`)
      if (!elemento) {
        return false
      }
      resaltado = elemento
      elemento.classList.add(CLASE_RESALTADA)
      elemento.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return true
    }

    const id = resaltar() ? 0 : window.setTimeout(resaltar, 60)

    return () => {
      if (id) window.clearTimeout(id)
      resaltado?.classList.remove(CLASE_RESALTADA)
    }
  }, [enSenal, paso, senales, contenedorId])

  // 'partial' no es un fallo: no puede verse igual que haber entregado la clave.
  const tono =
    node.kind === 'good'
      ? { borde: 'border-success/40', fondo: 'bg-success', tinta: 'text-on-success', icono: '✓' }
      : node.kind === 'partial'
        ? { borde: 'border-warning/40', fondo: 'bg-warning', tinta: 'text-on-warning', icono: '!' }
        : { borde: 'border-danger/40', fondo: 'bg-danger', tinta: 'text-on-danger', icono: '✕' }

  return (
    <div className={`rounded-lg border bg-surface p-4 ${tono.borde}`}>
      <p className="flex items-center gap-2 text-lg font-semibold text-ink">
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-full text-sm ${tono.tinta} ${tono.fondo}`}
          aria-hidden
        >
          {tono.icono}
        </span>
        {node.verdict}
      </p>
      <p className="mt-2 text-base leading-relaxed text-body">{node.outcome}</p>

      <EtiquetaAprobacion node={node} />

      {enVeredicto && (
        <button
          ref={primerBotonRef}
          type="button"
          className="mt-5 min-h-12 w-full rounded-md border border-hairline-strong bg-surface px-4 py-3 text-lg font-medium text-ink transition hover:bg-canvas-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          onClick={() => setPaso(0)}
        >
          Ver las señales
        </button>
      )}

      {enSenal && (
        <div
          role="region"
          aria-label="Repaso de señales"
          className="mt-4 rounded-md border border-signal-border bg-signal p-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-ink">
              Señal {paso + 1} de {senales.length}
            </h4>
            <button
              type="button"
              className="text-base font-medium text-link underline"
              onClick={() => setPaso(senales.length)}
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
              dangerouslySetInnerHTML={{ __html: masLarga }}
            />
            <p
              className="absolute inset-0 text-lg leading-relaxed text-signal-body"
              dangerouslySetInnerHTML={{ __html: senales[paso]?.texto ?? '' }}
            />
          </div>
          {/* "Anterior" se renderiza siempre (deshabilitado en el primer paso)
              para que "Siguiente" no se desplace entre pasos. */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={paso === 0}
              className="h-12 flex-1 rounded-md border border-hairline-strong bg-surface text-base font-medium text-ink transition hover:bg-canvas-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:cursor-default disabled:border-hairline disabled:text-muted-soft disabled:hover:bg-surface"
              onClick={() => setPaso((p) => p - 1)}
            >
              ← Anterior
            </button>
            <button
              type="button"
              className="h-12 flex-1 rounded-md bg-primary text-base font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
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
              className="text-lg leading-relaxed text-ink"
              dangerouslySetInnerHTML={{ __html: regla }}
            />
          </div>

          <AccionesFinal
            escenarioId={escenarioId}
            outcome={node.resultado ?? outcomeFromKind(node.kind)}
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
