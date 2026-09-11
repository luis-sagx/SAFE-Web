import { ArrowRight, CheckCircle2, LockKeyhole, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import AppHeader, { CLASE_ATRAS } from '../components/AppHeader'
import BarraProgreso from '../components/BarraProgreso'
import CierreModuloModal from '../components/CierreModuloModal'
import {
  escenariosDeSeccion,
  getSeccion,
  rutaEscenario,
  SECCIONES,
  type Seccion as SeccionCatalogo,
} from '../data/catalogo'
import { fetchProgreso, type Progreso } from '../lib/api'
import { escenarioEstaDisponible } from '../lib/bloqueoEscenarios'
import ConfirmarRepeticionModal from '../components/ConfirmarRepeticionModal'

// La dificultad no delata naturaleza (un legítimo puede ser tan difícil como uno de fraude). Estrellas + nombre para que
// se lea como escala a simple vista; ámbar y no `ink` para no confundir con el color del título.
const NOMBRE_DIFICULTAD = ['Fácil', 'Fácil', 'Media', 'Difícil', 'Difícil'] as const
const ESTRELLAS_DIFICULTAD = [1, 1, 2, 3, 3] as const

function Dificultad({ nivel }: { nivel: number }) {
  const nombre = NOMBRE_DIFICULTAD[nivel - 1] ?? 'Media'
  const llenas = ESTRELLAS_DIFICULTAD[nivel - 1] ?? 2

  return (
    <span className="inline-flex items-center gap-1" title={`Dificultad: ${nombre}`}>
      <span className="inline-flex items-center gap-px">
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            aria-hidden
            className={`size-2.5 ${i <= llenas ? 'fill-current text-warning' : 'text-hairline-strong'}`}
            strokeWidth={1.75}
          />
        ))}
      </span>
      <span className="text-sm text-muted">{nombre}</span>
    </span>
  )
}

// El umbral lo calcula el servidor (UMBRALES), no aquí, para no mentir si cambia; "desbloqueado" y "módulo existe"
// son dos condiciones distintas porque el participante solo puede actuar sobre la primera.
function SiguienteModulo({
  seccion,
  progreso,
}: {
  seccion: SeccionCatalogo
  progreso: Progreso | null
}) {
  const siguiente = SECCIONES[SECCIONES.findIndex((s) => s.id === seccion.id) + 1]
  // Sin progreso cargado no se sabe si está abierto, y una tarjeta que dice
  // "bloqueado" y se corrige sola un segundo después miente en el intervalo.
  if (!siguiente || !progreso) return null

  // Avanzar exige ver todos los escenarios del módulo anterior, no una nota mínima; la nota es solo para el certificado.
  const abierto = progreso.escenarios.length >= escenariosDeSeccion(seccion.id).length
  const listo = escenariosDeSeccion(siguiente.id).length > 0
  const faltan = Math.max(escenariosDeSeccion(seccion.id).length - progreso.escenarios.length, 0)
  const Icono = siguiente.Icono

  const estado = !abierto
    ? `Se abre al completar todos los escenarios de ${seccion.titulo}. Te ${faltan === 1 ? 'falta' : 'faltan'} ${faltan}.`
    : listo
      ? siguiente.descripcion
      : 'Ya lo desbloqueaste. Estamos preparando sus escenarios.'

  const contenido = (
    <>
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-strong ${
          abierto && listo ? 'text-link' : 'text-muted'
        }`}
      >
        {abierto ? (
          <Icono aria-hidden className="size-5" strokeWidth={1.75} />
        ) : (
          <LockKeyhole aria-hidden className="size-5" strokeWidth={1.75} />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.88px] text-muted">
          Siguiente módulo
        </p>
        <h2 className="mt-1 text-lg font-semibold text-ink">{siguiente.titulo}</h2>
        <p className="mt-1 text-base leading-relaxed text-body">{estado}</p>
      </div>

      {abierto && !listo && (
        <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.88px] text-muted">
          Pronto
        </span>
      )}
      {abierto && listo && (
        <span
          aria-hidden
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-link transition group-hover:translate-x-0.5"
        >
          Continuar
          <ArrowRight className="size-4" strokeWidth={2} />
        </span>
      )}
    </>
  )

  // Franja horizontal y no otra tarjeta: es el paso siguiente del recorrido, no
  // un escenario más de esta lista.
  const clases = 'mt-8 flex items-center gap-4 rounded-lg border p-5 transition'

  return abierto && listo ? (
    <Link
      to={`/seccion/${siguiente.id}`}
      className={`group ${clases} border-hairline-strong bg-surface hover:-translate-y-0.5 hover:border-link/40 hover:shadow-card`}
    >
      {contenido}
    </Link>
  ) : (
    <div className={`${clases} border-hairline-strong bg-canvas-soft`}>{contenido}</div>
  )
}

function Seccion() {
  const { seccionId } = useParams()
  const seccion = getSeccion(seccionId)
  const [progreso, setProgreso] = useState<Progreso | null>(null)
  const [mostrarCierre, setMostrarCierre] = useState(false)
  const [mostrarRepeticion, setMostrarRepeticion] = useState(false)
  const navigate = useNavigate()

  // getSeccion() devuelve un objeto nuevo en cada render: la dependencia es
  // seccion?.id, no seccion, para no pedir el progreso de nuevo en cada uno.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Una sección sin escenarios no tiene gating configurado en el backend:
    // pedirlo solo daría un 404 esperado.
    if (!seccion || escenariosDeSeccion(seccion.id).length === 0) return
    let cancelled = false

    fetchProgreso(seccion.id)
      .then((p) => {
        if (!cancelled) setProgreso(p)
      })
      .catch(() => {
        // El progreso es informativo: si no carga, la sección sigue usable.
      })

    return () => {
      cancelled = true
    }
  }, [seccion?.id])

  if (!seccion) {
    return <Navigate to="/dashboard" replace />
  }

  const escenarios = escenariosDeSeccion(seccion.id)
  const faltan = progreso ? Math.max(progreso.requeridos - progreso.aprobados, 0) : 0


  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader
        atras={
          <Link to="/dashboard" className={CLASE_ATRAS}>
            ← Volver
          </Link>
        }
      />

      {/* Mismo ancho que dashboard y barra superior: las tres pantallas se leen como una sola, sin saltos al entrar. */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.88px] text-muted">
          <seccion.Icono aria-hidden className="size-4 text-link" strokeWidth={2} />
          {seccion.titulo}
          <span aria-hidden className="text-muted-soft">
            ·
          </span>
          {seccion.canal}
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">{seccion.titulo}</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-body">{seccion.descripcion}</p>

        {/* Avance antes que las tarjetas, ancho completo: es lo primero que se busca al volver a la sección. */}
        {progreso && escenarios.length > 0 && (
          <section
            aria-labelledby="titulo-progreso"
            className="mt-8 rounded-lg border border-hairline-strong bg-canvas-soft p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h2
                id="titulo-progreso"
                className="text-xs font-semibold uppercase tracking-[0.88px] text-muted"
              >
                Progreso del módulo
              </h2>
              {/* El umbral no se repite en texto: ya lo marca el anillo de la barra (BarraProgreso). */}
              <p className="text-sm font-medium text-ink">
                <span className="text-lg font-semibold tabular-nums">{progreso.aprobados}</span>
                <span className="text-muted">/{escenarios.length}</span>
              </p>
            </div>

            <BarraProgreso
              className="mt-3"
              aprobados={progreso.aprobados}
              total={escenarios.length}
              requeridos={progreso.requeridos}
              aprobado={progreso.aprobado}
              etiqueta={`Avance de ${seccion.titulo}`}
            />

            {progreso.rondaEnCurso && (
              <p className="mt-2 text-sm text-muted">Repetición en curso: {progreso.rondaEnCurso.jugados}/{escenarios.length}</p>
            )}
            {progreso.rondaEnCurso && (
              <p className="mt-2 text-sm text-body">Tu nota se mantiene en {progreso.aprobados}/{escenarios.length} hasta que termines los {escenarios.length} de esta repetición.</p>
            )}

            {progreso.aprobado ? (
              // Resumen completo vive en el modal, no aquí: siempre visible competía con las tarjetas de escenarios.
              <button
                type="button"
                onClick={() => setMostrarCierre(true)}
                className="mt-3 text-sm font-medium text-link underline"
              >
                Ver resumen del módulo
              </button>
            ) : (
              <p className="mt-3 text-sm text-body">
                {`Te ${faltan === 1 ? 'falta' : 'faltan'} ${faltan} para aprobar el módulo.`}
              </p>
            )}
          </section>
        )}

        {progreso && progreso.rondaEnCurso === null && progreso.escenarios.length >= escenarios.length && (
          <div className="mt-8 flex items-center justify-between rounded-lg border border-hairline-strong bg-canvas-soft p-5">
            <p className="text-base text-body">Ya recorriste todos los escenarios del módulo.</p>
            <button type="button" onClick={() => setMostrarRepeticion(true)} className="rounded-md bg-primary px-4 py-2 font-medium text-on-primary">Repetir el módulo</button>
          </div>
        )}

        {mostrarRepeticion && progreso && (
          <ConfirmarRepeticionModal seccionId={seccion.id} titulo={seccion.titulo} aprobados={progreso.aprobados} aprobado={progreso.aprobado} onClose={() => setMostrarRepeticion(false)} onConfirm={() => escenarios[0] && navigate(rutaEscenario(escenarios[0]), { state: { iniciarRepeticion: true } })} />
        )}

        {mostrarCierre && progreso?.aprobado && (
          <CierreModuloModal
            seccion={seccion}
            escenarios={escenarios}
            progreso={progreso}
            onClose={() => setMostrarCierre(false)}
          />
        )}

        {escenarios.length === 0 ? (
          <p className="mt-10 rounded-lg border border-hairline-strong bg-surface p-5 text-base text-body">
            Estamos preparando los escenarios de esta sección.
          </p>
        ) : (
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {escenarios.map((escenario, indice) => {
              // "Sin jugar" y no otra insignia antes de jugar: delataría si es fraude o legítimo. La ronda en curso solo
              // actualiza los escenarios ya rejugados esta vez; los demás mantienen su resultado previo (si no, repetir
              // uno apagaba la insignia de los otros).
              const enRondaActual = progreso?.rondaEnCurso?.escenarios.find(
                (e) => e.id === escenario.id,
              )
              const ultimo = enRondaActual
                ? enRondaActual.ultimoOutcome
                : progreso?.escenarios.find((e) => e.id === escenario.id)?.ultimoOutcome
              const aprobado = ultimo === 'CORRECTO'
              const disponible = escenarioEstaDisponible(escenarios, progreso, escenario.id)
              const cardClassName = `group flex w-full flex-col rounded-lg border bg-surface p-5 transition ${
                disponible ? 'hover:-translate-y-0.5 hover:shadow-card' : 'opacity-70'
              } ${
                aprobado
                  ? 'border-mint-mid hover:border-success/50'
                  : disponible
                    ? 'border-hairline-strong hover:border-link/40'
                    : 'border-hairline-strong'
              }`
              const contenido = (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`font-mono text-xs font-medium tabular-nums ${
                        aprobado ? 'text-success-ink' : 'text-muted'
                      }`}
                    >
                      {String(indice + 1).padStart(2, '0')}
                    </span>
                    <Dificultad nivel={escenario.dificultad} />
                  </div>

                  <h3 className="mt-3 text-lg font-semibold text-ink">{escenario.titulo}</h3>
                  <p className="mt-2 flex-1 text-base leading-relaxed text-body">
                    {escenario.descripcion}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3">
                    {aprobado ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.88px] text-success-ink">
                        <CheckCircle2 aria-hidden className="size-3.5" strokeWidth={2.5} />
                        Aprobado
                      </span>
                    ) : ultimo !== undefined ? (
                      <span className="text-xs font-semibold uppercase tracking-[0.88px] text-muted">
                        Sin aprobar
                      </span>
                    ) : disponible ? (
                      <span className="text-xs font-semibold uppercase tracking-[0.88px] text-muted">
                        Sin jugar
                      </span>
                    ) : (
                      /* El candado señala el escenario anterior en la lista, no el próximo pendiente del módulo: cada
                         uno depende del de al lado, no de un número fijo. */
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
                        <LockKeyhole aria-hidden className="size-3.5" strokeWidth={2.5} />
                        Se abre al terminar el {String(indice).padStart(2, '0')}
                      </span>
                    )}
                    <span
                      aria-hidden
                      className={`text-sm font-medium transition ${
                        disponible ? 'text-link group-hover:translate-x-0.5' : 'text-muted'
                      }`}
                    >
                      {disponible ? (ultimo !== undefined ? 'Repetir →' : 'Empezar →') : ''}
                    </span>
                  </div>
                </>
              )

              return (
                <li key={escenario.id} className="flex">
                  {disponible ? (
                    <Link
                      to={rutaEscenario(escenario)}
                      className={cardClassName}
                    >
                      {contenido}
                    </Link>
                  ) : (
                    <div className={cardClassName} aria-disabled="true">
                      {contenido}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        )}

        <SiguienteModulo seccion={seccion} progreso={progreso} />
      </main>
    </div>
  )
}

export default Seccion
