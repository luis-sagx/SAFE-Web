import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { escenariosDeSeccion, getSeccion, rutaEscenario, SECCIONES } from '../../data/catalogo'
import { fetchProgreso } from '../../lib/api'
import type { RunOutcome } from '../../lib/api'
import { conEscenarioIntentado, siguienteEnRonda } from '../../lib/bloqueoEscenarios'
import ConfirmarRepeticionModal from '../ConfirmarRepeticionModal'

interface AccionesFinalProps {
  escenarioId: string
  // outcome puede llegar antes de que el servidor guarde la corrida.
  outcome: RunOutcome
  onRestart?: () => void
  restartLabel?: string
  autoFocus?: boolean
}

// Mientras queden escenarios sin intentar, la acción principal es "siguiente",
// no repetir: repetir de entrada infla el resultado con reintentos en vez de
// medir lo que la persona sabía (el gating cuenta el último intento).
function AccionesFinal({ escenarioId, outcome, autoFocus }: AccionesFinalProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const seccionId = escenarioId.split('/')[0] ?? ''
  const escenarios = escenariosDeSeccion(seccionId)
  const siguienteModulo = SECCIONES[SECCIONES.findIndex((seccion) => seccion.id === seccionId) + 1]

  // null mientras no se sabe: hasta que llegue el progreso se usa el orden del
  // catálogo, que da un "siguiente" razonable sin dejar la pantalla en blanco.
  const [intentados, setIntentados] = useState<Set<string> | null>(null)
  // Cuántos van aprobados contra el umbral. Es el dato que convierte un
  // escenario suelto en avance de un curso, y el momento de decirlo es
  // justo después del veredicto.
  const [avance, setAvance] = useState<{ aprobados: number; requeridos: number; rondaEnCurso?: { jugados: number } } | null>(null)
  const [mostrarRepeticion, setMostrarRepeticion] = useState(false)
  const [progreso, setProgreso] = useState<import('../../lib/api').Progreso | null>(null)
  const principalRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null)

  useEffect(() => {
    if (escenarios.length === 0) return
    let cancelado = false

    fetchProgreso(seccionId)
      .then((progreso) => {
        if (cancelado) return
        // Se añade a mano: la corrida se guarda en paralelo y este progreso
        // puede haberse pedido antes de que el servidor la registre.
        setIntentados(new Set([...progreso.escenarios.map((e) => e.id), escenarioId]))
        setAvance({ aprobados: progreso.aprobados, requeridos: progreso.requeridos, rondaEnCurso: progreso.rondaEnCurso ?? undefined })
        setProgreso(progreso)
      })
      .catch(() => {
        // Sin progreso se sigue con el orden del catálogo, para no dejar al
        // participante sin ningún botón por un fallo de red.
      })

    return () => {
      cancelado = true
    }
  }, [seccionId, escenarioId])

  useEffect(() => {
    if (autoFocus) principalRef.current?.focus()
  }, [autoFocus])

  const indiceActual = escenarios.findIndex((e) => e.id === escenarioId)
  const estadoNavegacion = location.state as {
    iniciarRepeticion?: boolean
    repeticionIntentados?: { id: string; outcome: RunOutcome }[]
  } | null
  const enRepeticion = estadoNavegacion?.iniciarRepeticion === true
  const intentadosEnRepeticion = estadoNavegacion?.repeticionIntentados ?? []
  const progresoAntesDelActual = progreso && enRepeticion
    ? intentadosEnRepeticion.reduce(
        (actual, intento) => conEscenarioIntentado(actual, intento.id, intento.outcome, true),
        progreso,
      )
    : progreso
  const progresoEfectivo = progreso
    ? conEscenarioIntentado(progresoAntesDelActual!, escenarioId, outcome, enRepeticion)
    : null
  const resultadosEnCurso = progresoEfectivo?.rondaEnCurso?.escenarios ?? progresoEfectivo?.escenarios ?? []
  const aprobadosEfectivos = resultadosEnCurso.filter((resultado) => resultado.ultimoOutcome === 'CORRECTO').length
  const aprobadoEfectivo = progresoEfectivo
    ? aprobadosEfectivos >= progresoEfectivo.requeridos && resultadosEnCurso.length >= escenarios.length
    : false
  const siguiente = progresoEfectivo
    ? siguienteEnRonda(escenarios, progresoEfectivo)
    : intentados
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

  // Aparece solo cuando el progreso ya llegó (un instante después del veredicto).
  const marcador = avance && (
    <p className="mt-4 text-center text-base text-body">
      {(progresoEfectivo ? aprobadosEfectivos : avance.aprobados) >= avance.requeridos ? (
        <>
          Llevas <span className="font-semibold text-ink tabular-nums">{progresoEfectivo ? aprobadosEfectivos : avance.aprobados}</span>{' '}
          aprobados en este módulo: ya superaste los {avance.requeridos} que hacían falta.
        </>
      ) : (
        <>
          Llevas <span className="font-semibold text-ink tabular-nums">{progresoEfectivo ? aprobadosEfectivos : avance.aprobados}</span> de
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
          to={rutaEscenario(siguiente)}
          // El guardado es async: si al navegar el servidor aún no lo registró,
          // la siguiente pantalla vería este escenario "sin intentar" y
          // rebotaría a la sección. `recienCompletado` evita eso.
          state={{
            recienCompletado: escenarioId,
            iniciarRepeticion: enRepeticion || progresoEfectivo?.rondaEnCurso != null,
            repeticionIntentados: enRepeticion
              ? [...intentadosEnRepeticion, { id: escenarioId, outcome }]
              : undefined,
          }}
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
          Ya recorriste los {escenarios.length} escenarios del módulo.
        </p>
      )}
      <Link
        ref={principalRef as React.Ref<HTMLAnchorElement>}
        to={siguienteModulo ? `/seccion/${siguienteModulo.id}` : '/dashboard'}
        className="mt-3 flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-lg font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
      >
        {siguienteModulo ? 'Ir al siguiente módulo →' : 'Volver al panel →'}
      </Link>
      {progreso && !aprobadoEfectivo && (
        <>
          <p className="mt-4 text-center text-base text-body">
            Aún no alcanzas la nota mínima. Puedes repetir el módulo completo para intentarlo de nuevo.
          </p>
          <button
            type="button"
            className="mt-3 min-h-11 w-full rounded-md border border-hairline-strong px-4 py-3 text-lg font-medium text-body transition hover:bg-surface-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
            onClick={() => setMostrarRepeticion(true)}
          >
            Repetir el módulo
          </button>
        </>
      )}
      {mostrarRepeticion && progreso && !aprobadoEfectivo && (
        <ConfirmarRepeticionModal
          seccionId={seccionId}
          titulo={getSeccion(seccionId)?.titulo ?? seccionId}
          aprobados={aprobadosEfectivos}
          aprobado={aprobadoEfectivo}
          onClose={() => setMostrarRepeticion(false)}
          onConfirm={() => escenarios[0] && navigate(rutaEscenario(escenarios[0]), { state: { iniciarRepeticion: true } })}
        />
      )}
      {volver}
    </>
  )
}

export default AccionesFinal
