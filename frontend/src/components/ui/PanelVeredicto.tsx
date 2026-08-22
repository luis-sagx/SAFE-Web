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
  /** Nodo del grafo cuya pantalla contiene esta señal.
   *
   *  Un escenario de varias pantallas termina mostrando la última —la página
   *  falsa, por ejemplo—, y ahí las señales del correo no tienen nada que
   *  resaltar: se explicaban en texto sobre una pantalla que ya no las
   *  contenía. Con esto el repaso devuelve la vista a la pantalla de cada
   *  señal antes de señalarla. */
  pantalla?: string
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
  /** Avisa qué pantalla toca mostrar en cada paso del repaso. */
  onPantalla?: (pantallaId: string | undefined) => void
}

const CLASE_RESALTADA = 'senal-resaltada'

/**
 * Panel de resultado de todos los escenarios: primero el
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
  onPantalla,
}: PanelVeredictoProps) {
  const haySenales = senales.length > 0

  // -1 = veredicto todavía sin abrir el recorrido, 0..N-1 = viendo esa señal,
  // N = cierre. Sin señales no hay recorrido que abrir: se arranca ya en el
  // cierre para que siempre haya un botón visible que avance algo.
  const [paso, setPaso] = useState(haySenales ? -1 : 0)

  // Para reservar el alto del recorrido (ver más abajo). Se compara sin las
  // etiquetas: <b> ocupa en el texto pero no en la pantalla.
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

    // En dos tiempos: la pantalla que contiene la señal puede estar montándose
    // todavía cuando corre este efecto, así que si no aparece a la primera se
    // vuelve a buscar en el siguiente cuadro.
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
      <p className="flex items-center gap-2 text-lg font-semibold text-ink">
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-full text-sm text-white ${tono.fondo}`}
          aria-hidden
        >
          {tono.icono}
        </span>
        {node.verdict}
      </p>
      <p className="mt-3 text-lg leading-relaxed text-body">{node.outcome}</p>

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
        <div className="mt-5 rounded-md bg-canvas-soft p-4">
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
          {/* Alto reservado: sin él los textos van de una a seis líneas y la
              fila de botones sube y baja entre paso y paso, obligando a buscar
              el botón de nuevo cada vez. Lo reserva la señal más larga de este
              escenario, dibujada invisible debajo, y no una medida fija: con
              un número fijo el panel de un escenario de señales cortas mide lo
              mismo que el del más largo del catálogo y hay que hacer scroll
              para ver los botones. */}
          <div className="relative mt-3">
            <p
              aria-hidden
              className="invisible text-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: masLarga }}
            />
            <p
              className="absolute inset-0 text-lg leading-relaxed text-body"
              dangerouslySetInnerHTML={{ __html: senales[paso]?.texto ?? '' }}
            />
          </div>
          {/* "Anterior" se renderiza siempre, deshabilitado en el primer paso.
              Antes aparecía a partir del segundo, así que "Siguiente" pasaba de
              ocupar toda la fila a la mitad y se desplazaba casi 200px justo
              cuando la persona iba a volver a pulsarlo. Un botón deshabilitado
              queda además fuera del recorrido del teclado, sin necesidad de
              ocultarlo. */}
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
