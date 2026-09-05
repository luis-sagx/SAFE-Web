import type { ReactNode } from 'react'

/**
 * Lo que ocupa el lugar de la lista de opciones cuando el escenario se juega
 * sobre la pantalla.
 *
 * Responde las tres preguntas que un participante se hace al entrar y que, sin
 * lista, nadie contesta: qué se espera de mí, con qué puedo interactuar y qué
 * pasa cuando toco algo.
 *
 * Vive aquí y no en cada escenario porque el aviso de "ahí no hay nada" y la
 * pista desplegable son idénticos en todos: dos copias del mismo texto acaban
 * divergiendo, como ya pasó con la ventana de correo.
 */
function Instrucciones({
  children,
  queHaces,
  cuandoTermina,
  pista,
  fallo,
}: {
  /** Cómo se juega este escenario. Se ignora si se pasa `queHaces`: son dos
   *  formas de dar el mismo contenido, no dos secciones distintas. */
  children?: ReactNode
  /** Atajo para el caso común: título "¿Qué haces?" + el texto de la
   *  situación, envueltos en el mismo `grid` en todos los escenarios que lo
   *  usan. Pasar esto en vez de armar ese envoltorio a mano en cada archivo
   *  es lo que evita que las siete copias del mismo `<div className="grid
   *  gap-3">` diverjan o se marquen como código duplicado. */
  queHaces?: ReactNode
  /** Cuándo se da por terminada la corrida. Nace como un `<details>` propio,
   *  con o sin `queHaces`: el heading "¿Qué haces?" a veces lo pone el
   *  escenario por fuera (ver StoryEscenario), pero esto es igual en todos. */
  cuandoTermina?: ReactNode
  /** Los caminos posibles, sin decir cuál es el bueno. Se abre solo si el
   *  participante la pide. */
  pista?: ReactNode
  /** Si ya intentó pulsar algo que no responde. */
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

      {/* Solo aparece si ya tocó algo que no responde: es exactamente la
          persona que está atascada, y la pista le llega sin habérsela ofrecido
          antes a quien no la necesita. */}
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
