import { outcomeFromKind } from '../../hooks/useScenarioRun'
import type { StoryNode } from '../../hooks/useStoryEngine'

/**
 * Si el escenario quedó aprobado o no, dicho con todas las letras.
 *
 * El veredicto narrado ("Caíste en la trampa", "No caíste · te detuviste a
 * tiempo") cuenta qué pasó en la historia, pero no si eso suma para los 6 de 8
 * que pide el módulo. Son cosas distintas y la más confusa es PARCIAL: "no
 * entregaste la clave, pero contestaste" suena a aprobado y no lo es.
 *
 * El estado se calcula del mismo resultado que se envía al servidor
 * —`resultado` si el nodo lo fuerza, si no el que sale de `kind`— y no del tono
 * visual, para que la etiqueta no pueda contradecir a lo que quedó guardado.
 * La regla es la del backend: solo CORRECTO acredita (ver progreso.ts).
 *
 * No muestra el puntaje: es casi siempre el mismo número que ya dice esta
 * etiqueta (0/50/100 según el resultado, con cuatro excepciones sueltas en
 * 20/60), y sin ese contexto solo generaba la pregunta de qué lo movía y para
 * qué servía. El número se sigue guardando para el análisis del supervisor.
 */
function EtiquetaAprobacion({ node }: { node: StoryNode }) {
  const resultado = node.resultado ?? outcomeFromKind(node.kind)
  const aprobado = resultado === 'CORRECTO'

  return (
    <div className="mt-3">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.8125rem] font-semibold uppercase tracking-[0.88px] ${
          aprobado ? 'bg-mint-light text-primary' : 'bg-surface-strong text-body'
        }`}
      >
        {aprobado ? 'Escenario aprobado' : 'Escenario no aprobado'}
      </span>

      {!aprobado && (
        <p className="mt-2 text-base leading-relaxed text-body">
          Este no suma para los que necesitas aprobar en el módulo. Podrás repetirlo cuando hayas
          pasado por todos.
        </p>
      )}
    </div>
  )
}

export default EtiquetaAprobacion
