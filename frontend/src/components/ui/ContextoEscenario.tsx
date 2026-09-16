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
            <div key={password}>
              <dt className="font-mono text-sm uppercase tracking-[0.14em] text-muted">
                {label}
              </dt>
              {/* Tinta de titular, no de cuerpo secundario: la escena es el contenido
                  principal del briefing y va del mismo color que el saludo que la
                  presenta. Con dos tintas parecían dos niveles distintos de texto. */}
              <dd className="mt-1 text-lg leading-relaxed text-ink">{context[password]}</dd>
            </div>
          ) : null,
        )}
      </dl>
      {context.extra && <div className="mt-4">{context.extra}</div>}
    </>
  )
}

export default ScenarioContext
