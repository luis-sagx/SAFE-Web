import type { ReactNode } from 'react'

// Separa quién/qué/cuándo en piezas en vez de prosa corrida para que se lea
// de un vistazo (issue #28). Solo historia, nada de mecánica (eso va en `nota`).
export interface Contexto {
  antes: ReactNode
  ahora: ReactNode
  extra?: ReactNode
}

const FILAS = [
  ['antes', 'Antes de esto'],
  ['ahora', 'Lo que acaba de pasar'],
] as const

// Mismo bloque en el briefing y en el diálogo "Ver contexto" del escenario.
function ContextoEscenario({ contexto }: { contexto: Contexto }) {
  return (
    <>
      <dl className="grid gap-4">
        {FILAS.map(([clave, etiqueta]) =>
          contexto[clave] ? (
            <div key={clave} className="grid gap-0.5">
              <dt className="text-xs font-semibold uppercase tracking-[0.88px] text-muted">
                {etiqueta}
              </dt>
              <dd className="text-lg leading-relaxed text-body">{contexto[clave]}</dd>
            </div>
          ) : null,
        )}
      </dl>
      {contexto.extra && <div className="mt-4">{contexto.extra}</div>}
    </>
  )
}

export default ContextoEscenario
