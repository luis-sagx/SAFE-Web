import type { ReactNode } from 'react'

/**
 * La situación del escenario, en piezas y no en prosa corrida.
 *
 * Antes cada guion escribía sus dos párrafos y el dato que decide la partida
 * —quién te escribe, a qué hora, qué esperabas— quedaba enterrado a mitad de
 * una frase: había que leerlos enteros para sacarlo. Al obligar al guion a
 * separar quién/qué/cuándo, el bloque se lee de un vistazo y todos los
 * escenarios se leen igual (issue #28).
 *
 * Solo historia, nada de mecánica: cómo se juega sigue yendo en `nota`.
 */
export interface Contexto {
  /** Lo que ya era verdad antes del mensaje: a qué te dedicas, qué relación
   *  tenías con quien te escribe, o qué estabas haciendo. */
  antes: ReactNode
  /** El disparador. El cuándo va aquí dentro, en negrita, y no en una fila
   *  aparte: en la mitad de los escenarios era una fila de tres palabras, y
   *  suelto de la escena el dato no dice nada. Sin destripar la trampa: el
   *  bloque sitúa al participante, no decide por él. */
  ahora: ReactNode
  /** Material que la historia enseña tal cual —los mensajes que ya te
   *  escribieron, por ejemplo—, debajo de las filas. */
  extra?: ReactNode
}

/** Cada fila, con su etiqueta. El orden es el de la lectura: qué había, qué
 *  cambió, y qué matiza las dos cosas. */
const FILAS = [
  ['antes', 'Antes de esto'],
  ['ahora', 'Lo que acaba de pasar'],
] as const

/**
 * Mismo bloque en el briefing y en el diálogo "Ver contexto" de dentro del
 * escenario: quien lo consulta a mitad de partida busca el mismo dato en el
 * mismo sitio donde lo leyó antes de entrar.
 */
function ContextoEscenario({ contexto }: { contexto: Contexto }) {
  return (
    <>
      <dl className="grid gap-4">
        {FILAS.map(([clave, etiqueta]) =>
          contexto[clave] ? (
            <div key={clave} className="grid gap-0.5">
              {/* Etiqueta pequeña y en mayúsculas, como el título del diálogo:
                  tiene que poder saltarse con la vista para ir directo a la
                  fila que interesa, no competir con lo que dice la fila. */}
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
