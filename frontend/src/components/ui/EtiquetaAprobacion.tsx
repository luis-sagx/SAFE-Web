import { outcomeFromKind } from '../../hooks/useScenarioRun'
import type { StoryNode } from '../../hooks/useStoryEngine'

// Se calcula del mismo resultado que se envía al servidor, no del tono visual
// del veredicto narrado, para no contradecir lo guardado (solo CORRECTO
// acredita, ver progreso.ts). PARCIAL es la confusa: suena a aprobado y no lo es.
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
