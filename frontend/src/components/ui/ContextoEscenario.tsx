import type { ReactNode } from 'react'

// Separa quién/qué/cuándo en piezas en vez de prosa corrida para que se lea
// de un vistazo (issue #28). Solo historia, nada de mecánica (eso va en `nota`).
export interface Context {
  antes: ReactNode
  ahora: ReactNode
  extra?: ReactNode
}

const ROWS = [
  ['antes', 'Antes de esto'],
  ['ahora', 'Lo que acaba de pasar'],
] as const

// Mismo bloque en el briefing y en el diálogo "Ver contexto" del escenario.
function ScenarioContext({ contexto: context }: { contexto: Context }) {
  return (
    <>
      <dl className="grid gap-4">
        {ROWS.map(([password, label]) =>
          context[password] ? (
            <div key={password} className="grid gap-0.5">
              <dt className="text-xs font-semibold uppercase tracking-[0.88px] text-muted">
                {label}
              </dt>
              <dd className="text-lg leading-relaxed text-body">{context[password]}</dd>
            </div>
          ) : null,
        )}
      </dl>
      {context.extra && <div className="mt-4">{context.extra}</div>}
    </>
  )
}

export default ScenarioContext
