import { ArrowRight, CheckCircle2, LockKeyhole, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router'
import AppHeader from '../components/AppHeader'
import BarraProgreso from '../components/BarraProgreso'
import CierreModuloModal from '../components/CierreModuloModal'
import InfoLink from '../components/InfoLink'
import { escenariosDeSeccion, getSeccion, SECCIONES, type Seccion as SeccionCatalogo } from '../data/catalogo'
import { fetchProgreso, type Progreso } from '../lib/api'
import { escenarioEstaDisponible, escenarioFueJugado } from '../lib/bloqueoEscenarios'

/// La dificultad no delata nada: un escenario legítimo puede ser tan difícil
/// como uno de fraude, y de hecho los que espejan lo son.
///
/// Tres estrellas chicas junto al nombre, no cinco puntos ni el nombre solo:
/// las estrellas solas no bastaban —nada en la tarjeta decía que eran una
/// escala de dificultad y no otra cosa—, y el nombre solo no daba una imagen
/// que se lea de un vistazo entre varias tarjetas. Van las dos, pequeñas.
/// El ámbar y no el `ink` del texto: `ink` es el color del contenido de la
/// tarjeta, y una estrella "llena" del mismo color que un título no se lee
/// como calificación.
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

/**
 * A dónde se sigue cuando esta sección ya dio de sí.
 *
 * El orden del recorrido es el de SECCIONES, así que "el siguiente" es
 * literalmente el de al lado; la última no muestra nada porque no hay a dónde
 * seguir. Aparece al cierre de la lista y no arriba: es lo que se hace después
 * de jugar, no antes.
 *
 * El umbral no se decide aquí. `aprobado` lo calcula el servidor con su propio
 * UMBRALES (6 de 8 en phishing) y es el mismo que abre los escenarios; copiar
 * el número al cliente lo dejaría mintiendo el día que cambie en el backend.
 *
 * Son dos condiciones distintas y se dicen por separado, porque el participante
 * no puede hacer nada con la segunda: que tú lo hayas desbloqueado, y que el
 * módulo exista ya.
 */
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

  const abierto = progreso.aprobado
  const listo = escenariosDeSeccion(siguiente.id).length > 0
  const faltan = Math.max(progreso.requeridos - progreso.aprobados, 0)
  const Icono = siguiente.Icono

  const estado = !abierto
    ? `Se abre al aprobar ${progreso.requeridos} escenarios de ${seccion.titulo}. Te ${faltan === 1 ? 'falta' : 'faltan'} ${faltan}.`
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
  const bloqueado = (useLocation().state as { bloqueado?: string } | null)?.bloqueado

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

  // El único escenario abierto de los que faltan: es el que hay que terminar
  // para que se abra el siguiente, y por eso es el que nombran los candados.
  const pendiente = escenarios.findIndex((e) => !escenarioFueJugado(progreso, e.id))
  const abre = String(pendiente + 1).padStart(2, '0')

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader>
        <Link to="/dashboard" className="text-sm font-medium text-link underline">
          ← Volver
        </Link>
        <InfoLink />
      </AppHeader>

      {/* Mismo ancho que el dashboard y que la barra superior: las tres
          pantallas de navegación se leen como una sola, sin que el contenido
          salte de sitio al entrar en una sección. */}
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

        {/* Por qué la página cambió sola. Lo pone RequireEscenarioDisponible al
            redirigir; `role="status"` para que un lector de pantalla lo anuncie
            al llegar, que es justo cuando hace falta. */}
        {bloqueado && (
          <output
            className="mt-6 max-w-2xl rounded-lg border border-hairline-strong bg-canvas-soft px-4 py-3 text-base text-body"
          >
            «{bloqueado}» todavía no está abierto. Termina el escenario {abre} para llegar a él.
          </output>
        )}

        {/* El bloque de avance va antes que las tarjetas y ocupa el ancho
            completo: es lo que el participante viene a consultar cuando vuelve
            a la sección, y como insignia suelta se perdía. */}
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
              {/* El umbral no se repite en texto: la barra ya lo marca con un
                  anillo en su propia celda (BarraProgreso), como en un curso
                  que no imprime la nota mínima en cada pantalla. */}
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

            {progreso.aprobado ? (
              // El resumen completo vive en el modal, no aquí: un bloque de
              // discriminadores permanentemente visible en cada visita a una
              // sección ya aprobada competía con las tarjetas de escenarios.
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
              // Sin intentar no muestra ninguna insignia de resultado: mostrar
              // algo distinto de "aprobado"/"falta" antes de jugarlo delataría
              // si el escenario es fraude o legítimo, y el menú no puede hacer
              // eso. "Sin jugar" es seguro porque no habla del contenido.
              const ultimo = progreso?.escenarios.find((e) => e.id === escenario.id)?.ultimoOutcome
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
                        aprobado ? 'text-success' : 'text-muted'
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
                      <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.88px] text-success">
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
                      /* El candado dice qué lo abre: el escenario justo
                         anterior en la lista, no el próximo pendiente del
                         módulo. El 08 depende del 07, no del 03 — mostrar el
                         mismo número en las cinco tarjetas bloqueadas decía
                         que todas se abrían con el mismo paso, cuando cada
                         una depende de que se termine la de al lado. */
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
                      to={`/seccion/${escenario.seccionId}/${escenario.escenarioId}`}
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
