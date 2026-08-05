import { CheckCircle2, LockKeyhole } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import AppHeader from '../components/AppHeader'
import BarraProgreso from '../components/BarraProgreso'
import InfoLink from '../components/InfoLink'
import { escenariosDeSeccion, getSeccion } from '../data/catalogo'
import { fetchProgreso, type Progreso } from '../lib/api'
import { escenarioEstaDisponible } from '../lib/bloqueoEscenarios'

/// Los puntos de dificultad no delatan nada: un escenario legítimo puede ser
/// tan difícil como uno de fraude, y de hecho los que espejan lo son.
function Dificultad({ nivel }: { nivel: number }) {
  return (
    <span className="flex items-center gap-[3px]" title={`Dificultad ${nivel} de 5`}>
      <span className="sr-only">Dificultad {nivel} de 5</span>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={`size-[5px] rounded-full ${i < nivel ? 'bg-muted' : 'bg-muted-soft/50'}`}
        />
      ))}
    </span>
  )
}

function Seccion() {
  const { seccionId } = useParams()
  const seccion = getSeccion(seccionId)
  const [progreso, setProgreso] = useState<Progreso | null>(null)

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
      <AppHeader>
        <Link to="/dashboard" className="text-sm font-medium text-link underline">
          ← Volver
        </Link>
        <InfoLink />
      </AppHeader>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">
          <seccion.Icono aria-hidden className="size-4 text-link" strokeWidth={2} />
          {seccion.titulo}
          <span aria-hidden className="text-muted-soft">
            ·
          </span>
          {seccion.canal}
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">{seccion.titulo}</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-body">{seccion.descripcion}</p>

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
                className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted"
              >
                Progreso del módulo
              </h2>
              <p className="text-sm font-medium text-ink">
                <span className="text-lg font-semibold tabular-nums">{progreso.aprobados}</span>
                <span className="text-muted">/{escenarios.length}</span>
                <span aria-hidden className="mx-2 text-muted-soft">
                  ·
                </span>
                <span className="text-body"></span>
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

            <p className="mt-3 text-sm text-body">
              {progreso.aprobado ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-success">
                  <CheckCircle2 aria-hidden className="size-4" strokeWidth={2.5} />
                  Módulo aprobado. Puedes repetir cualquier escenario si quieres.
                </span>
              ) : (
                `Te ${faltan === 1 ? 'falta' : 'faltan'} ${faltan} para aprobar el módulo.`
              )}
            </p>
          </section>
        )}

        {escenarios.length === 0 ? (
          <p className="mt-10 rounded-lg border border-hairline-strong bg-surface p-5 text-base text-body">
            Estamos preparando los escenarios de esta sección.
          </p>
        ) : (
          <ol className="mt-8 grid gap-4 sm:grid-cols-2">
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
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.88px] text-success">
                        <CheckCircle2 aria-hidden className="size-3.5" strokeWidth={2.5} />
                        Aprobado
                      </span>
                    ) : ultimo !== undefined ? (
                      <span className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">
                        Sin aprobar
                      </span>
                    ) : disponible ? (
                      <span className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted-soft">
                        Sin jugar
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">
                        <LockKeyhole aria-hidden className="size-3.5" strokeWidth={2.5} />
                        Bloqueado
                      </span>
                    )}
                    <span
                      aria-hidden
                      className={`text-sm font-medium transition ${
                        disponible ? 'text-link group-hover:translate-x-0.5' : 'text-muted'
                      }`}
                    >
                      {disponible ? (ultimo !== undefined ? 'Repetir →' : 'Empezar →') : 'Candado'}
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
      </main>
    </div>
  )
}

export default Seccion
