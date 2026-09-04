import { outcomeFromKind, scoreFromOutcome } from '../../hooks/useScenarioRun'
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
 * El puntaje que se muestra al lado es la misma derivación que usa
 * `useScenarioRun` para lo que envía al servidor (`node.score ?? scoreFromOutcome(...)`):
 * un solo cálculo, así que esta etiqueta no puede decir un número distinto del
 * que quedó guardado.
 *
 * Es la calidad de esta corrida, no un saldo. No hay total acumulado ni
 * "mejor intento": el gating cuenta el último intento (progreso.ts), y un
 * puntaje que se pudiera hacer crecer repitiendo sería una vía para inflar el
 * resultado sin haber aprendido nada — la misma razón por la que
 * `AccionesFinal` esconde "Repetir" hasta terminar el módulo.
 */
function EtiquetaAprobacion({ node }: { node: StoryNode }) {
  const resultado = node.resultado ?? outcomeFromKind(node.kind)
  const puntaje = node.score ?? scoreFromOutcome(resultado)
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

      <span className="ml-2 inline-flex items-center text-sm font-medium text-muted">
        {puntaje}/100 puntos
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
