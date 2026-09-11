import type { ReactNode } from 'react'

// Vive aquí y no en cada escenario porque el aviso de "ahí no hay nada" y la
// pista desplegable son idénticos en todos; copiarlos ya divergió una vez
// (la ventana de correo).
function Instrucciones({
  children,
  queHaces,
  cuandoTermina,
  pista,
  fallo,
}: {
  children?: ReactNode // ignorado si se pasa queHaces
  queHaces?: ReactNode
  cuandoTermina?: ReactNode
  pista?: ReactNode
  fallo?: boolean
}) {
  return (
    <>
      {queHaces ? (
        <div className="grid gap-3">
          <p className="text-lg font-semibold text-ink">¿Qué haces?</p>
          {queHaces}
        </div>
      ) : (
        children
      )}

      {cuandoTermina && (
        <details className="text-base leading-relaxed text-body">
          <summary className="cursor-pointer list-none font-medium text-link underline decoration-dotted underline-offset-4">
            ¿Cuándo termina el escenario?
          </summary>
          <p className="mt-2">{cuandoTermina}</p>
        </details>
      )}

      {fallo && (
        <output className="rounded-md bg-surface-strong px-3 py-2 text-base text-body">
          Ahí no hay nada que hacer. Solo algunos elementos responden: recórrelos con el cursor (o
          con la tecla Tab) y se marcarán al pasar.
        </output>
      )}

      {pista && (
        <details className="group rounded-md border border-hairline-strong bg-surface px-3 py-2">
          <summary className="cursor-pointer list-none text-base font-medium text-link underline decoration-dotted underline-offset-4">
            No sé por dónde empezar
          </summary>
          <div className="mt-2 text-base leading-relaxed text-body">{pista}</div>
        </details>
      )}
    </>
  )
}

export default Instrucciones
