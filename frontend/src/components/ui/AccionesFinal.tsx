import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { escenariosDeSeccion } from '../../data/catalogo'
import { fetchProgreso } from '../../lib/api'

interface AccionesFinalProps {
  /** 'phishing/factura-sri'. De aquí sale la sección y el orden del módulo. */
  escenarioId: string
  onRestart: () => void
  /** Texto del botón de repetir, cuando repetir está disponible. */
  restartLabel: string
  /** Si toma el foco al aparecer. Lo pide el panel que no tiene recorrido de
   *  señales, donde este es el primer control de la pantalla. */
  autoFocus?: boolean
}

/**
 * Qué se ofrece al terminar un escenario.
 *
 * Mientras queden escenarios sin intentar en el módulo, la acción principal es
 * ir al siguiente, no repetir. Repetir de entrada invita a reintentar hasta
 * acertar, y entonces la corrida deja de medir lo que la persona sabía y pasa
 * a medir cuántas veces insistió; el gating cuenta el *último* intento, así
 * que además es una vía para inflar el resultado sin haber aprendido nada.
 *
 * Cuando ya se intentaron los ocho, repetir sí aparece: ahí es repaso, no
 * reintento, y la persona ya vio todo el módulo al menos una vez.
 *
 * "Siguiente" es el primero del catálogo que aún no se ha intentado, no el de
 * al lado: quien entra por el tercero no debería quedarse sin los dos
 * primeros.
 */
function AccionesFinal({ escenarioId, onRestart, restartLabel, autoFocus }: AccionesFinalProps) {
  const seccionId = escenarioId.split('/')[0] ?? ''
  const escenarios = escenariosDeSeccion(seccionId)

  // null mientras no se sabe: hasta que llegue el progreso se usa el orden del
  // catálogo, que da un "siguiente" razonable sin dejar la pantalla en blanco.
  const [intentados, setIntentados] = useState<Set<string> | null>(null)
  // Cuántos van aprobados contra el umbral. Es el dato que convierte un
  // escenario suelto en avance de un curso, y el momento de decirlo es
  // justo después del veredicto.
  const [avance, setAvance] = useState<{ aprobados: number; requeridos: number } | null>(null)
  const principalRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null)

  useEffect(() => {
    if (escenarios.length === 0) return
    let cancelado = false

    fetchProgreso(seccionId)
      .then((progreso) => {
        if (cancelado) return
        // El escenario recién terminado se añade a mano: su corrida se guarda
        // en paralelo y este progreso puede haberse pedido antes de que el
        // servidor la registre.
        setIntentados(new Set([...progreso.escenarios.map((e) => e.id), escenarioId]))
        setAvance({ aprobados: progreso.aprobados, requeridos: progreso.requeridos })
      })
      .catch(() => {
        // Sin progreso se sigue con el orden del catálogo. Quedarse sin ningún
        // botón por un fallo de red dejaría al participante encerrado.
      })

    return () => {
      cancelado = true
    }
  }, [seccionId, escenarioId])

  useEffect(() => {
    if (autoFocus) principalRef.current?.focus()
  }, [autoFocus])

  const indiceActual = escenarios.findIndex((e) => e.id === escenarioId)
  const siguiente = intentados
    ? escenarios.find((e) => !intentados.has(e.id))
    : escenarios[indiceActual + 1]

  const volver = (
    <Link
      to={`/seccion/${seccionId}`}
      className="mt-3 block text-center text-base font-medium text-link underline"
    >
      Volver a la sección
    </Link>
  )

  // El progreso llega un instante después del veredicto, así que este bloque
  // aparece solo cuando hay algo cierto que decir. Cuando ya se superó el
  // umbral lo dice, en vez de seguir contando contra una meta ya cumplida.
  const marcador = avance && (
    <p className="mt-4 text-center text-base text-body">
      {avance.aprobados >= avance.requeridos ? (
        <>
          Llevas <span className="font-semibold text-ink tabular-nums">{avance.aprobados}</span>{' '}
          aprobados en este módulo: ya superaste los {avance.requeridos} que hacían falta.
        </>
      ) : (
        <>
          Llevas <span className="font-semibold text-ink tabular-nums">{avance.aprobados}</span> de
          los <span className="tabular-nums">{avance.requeridos}</span> que necesitas para aprobar
          el módulo.
        </>
      )}
    </p>
  )

  if (siguiente) {
    const restantes = intentados
      ? escenarios.filter((e) => !intentados.has(e.id)).length
      : null

    return (
      <>
        {marcador}
        <Link
          ref={principalRef as React.Ref<HTMLAnchorElement>}
          to={`/seccion/${siguiente.seccionId}/${siguiente.escenarioId}`}
          className="mt-5 flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-3 text-lg font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
        >
          Siguiente escenario →
        </Link>
        {restantes !== null && (
          <p className="mt-2 text-center text-base text-muted">
            {restantes === 1 ? 'Te queda 1 escenario' : `Te quedan ${restantes} escenarios`} en este
            módulo.
          </p>
        )}
        {volver}
      </>
    )
  }

  return (
    <>
      {marcador}
      {escenarios.length > 0 && (
        <p className="mt-5 text-center text-base text-body">
          Ya recorriste los {escenarios.length} escenarios del módulo. Ahora puedes repetir el que
          quieras.
        </p>
      )}
      <button
        ref={principalRef as React.Ref<HTMLButtonElement>}
        type="button"
        className="mt-3 min-h-11 w-full rounded-md bg-primary px-4 py-3 text-lg font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
        onClick={onRestart}
      >
        {restartLabel}
      </button>
      {volver}
    </>
  )
}

export default AccionesFinal
