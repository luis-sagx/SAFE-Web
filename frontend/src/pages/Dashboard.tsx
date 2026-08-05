import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import AppHeader from '../components/AppHeader'
import BarraProgreso from '../components/BarraProgreso'
import InfoLink from '../components/InfoLink'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { escenariosDeSeccion, SECCIONES } from '../data/catalogo'
import { fetchProgreso, type Progreso } from '../lib/api'

/// Solo las secciones con escenarios tienen gating; las demás muestran
/// "Pronto" y no hace falta pedir su progreso.
const SECCIONES_ACTIVAS = SECCIONES.filter((s) => escenariosDeSeccion(s.id).length > 0)

/**
 * Avance del entrenamiento completo, sumando solo los módulos disponibles.
 *
 * Las secciones que aún no tienen escenarios se quedan fuera del denominador a
 * propósito: contarlas mostraría un avance de "3 de 48" que no refleja nada que
 * el participante pueda hacer hoy, y que se movería solo porque abrimos un
 * módulo nuevo.
 */
function calcularGlobal(progresos: Record<string, Progreso>) {
  let aprobados = 0
  let total = 0
  let requeridos = 0
  let modulosAprobados = 0

  for (const seccion of SECCIONES_ACTIVAS) {
    const progreso = progresos[seccion.id]
    total += escenariosDeSeccion(seccion.id).length
    if (!progreso) continue
    aprobados += progreso.aprobados
    requeridos += progreso.requeridos
    if (progreso.aprobado) modulosAprobados += 1
  }

  return { aprobados, total, requeridos, modulosAprobados, modulos: SECCIONES_ACTIVAS.length }
}

function Dashboard() {
  const { displayName, logout } = useAuth()
  const [progresos, setProgresos] = useState<Record<string, Progreso>>({})

  useEffect(() => {
    let cancelled = false

    Promise.all(SECCIONES_ACTIVAS.map((s) => fetchProgreso(s.id)))
      .then((resultados) => {
        if (cancelled) return
        setProgresos(Object.fromEntries(resultados.map((p) => [p.modulo, p])))
      })
      .catch(() => {
        // El progreso es informativo: si no carga, el dashboard sigue usable.
      })

    return () => {
      cancelled = true
    }
  }, [])

  const global = calcularGlobal(progresos)

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader>
        <span className="text-sm font-semibold text-ink">SAFE Web</span>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-body sm:inline">{displayName}</span>
          <InfoLink />
          <button
            type="button"
            onClick={logout}
            className="h-9 rounded-md border border-hairline-strong bg-surface px-3 text-sm font-medium text-ink transition hover:bg-surface-strong"
          >
            Salir
          </button>
        </div>
      </AppHeader>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">
          Entrenamiento
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">
          Hola, {displayName}
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-body">
          Elige un tipo de engaño y enfréntate a una situación como las de todos los días. No hay
          respuestas que te dejen mal: la idea es practicar.
        </p>

        {global.total > 0 && (
          <section
            aria-labelledby="titulo-global"
            className="mt-8 rounded-lg border border-hairline-strong bg-canvas-soft p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h2
                id="titulo-global"
                className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted"
              >
                Tu avance
              </h2>
              <p className="text-sm text-body">
                <span className="text-lg font-semibold tabular-nums text-ink">
                  {global.aprobados}
                </span>
                <span className="text-muted">/{global.total}</span> escenarios
                <span aria-hidden className="mx-2 text-muted-soft">
                  ·
                </span>
                <span className="font-medium text-ink tabular-nums">{global.modulosAprobados}</span>
                <span className="text-muted">/{global.modulos}</span>{' '}
                {global.modulos === 1 ? 'módulo' : 'módulos'}
              </p>
            </div>

            <BarraProgreso
              className="mt-3"
              variante="continua"
              aprobados={global.aprobados}
              total={global.total}
              requeridos={global.requeridos || undefined}
              aprobado={global.modulosAprobados === global.modulos}
              etiqueta="Avance del entrenamiento completo"
            />
          </section>
        )}

        {/* Tres columnas como máximo: las seis secciones se reparten en dos
            filas exactas. Con cuatro quedaba una fila coja. */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECCIONES.map((seccion) => {
            const escenarios = escenariosDeSeccion(seccion.id)
            const disponible = escenarios.length > 0
            const progreso = progresos[seccion.id]

            const Icono = seccion.Icono

            const contenido = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`flex size-9 items-center justify-center rounded-md bg-surface-strong ${disponible ? 'text-link' : 'text-muted'}`}
                  >
                    <Icono aria-hidden className="size-[18px]" strokeWidth={1.75} />
                  </span>
                  {!disponible && (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">
                      Pronto
                    </span>
                  )}
                  {progreso?.aprobado && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.88px] text-success">
                      <CheckCircle2 aria-hidden className="size-3.5" strokeWidth={2.5} />
                      Aprobado
                    </span>
                  )}
                </div>

                <h2 className="mt-4 text-lg font-semibold text-ink">{seccion.titulo}</h2>
                <p className="mt-2 flex-1 text-base leading-relaxed text-body">
                  {seccion.descripcion}
                </p>

                <div className="mt-5 border-t border-hairline pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted">{seccion.canal}</span>
                    {progreso && (
                      <span className="text-sm font-medium text-ink tabular-nums">
                        {progreso.aprobados}/{escenarios.length}
                        <span className="font-normal text-muted"> · meta {progreso.requeridos}</span>
                      </span>
                    )}
                  </div>
                  {progreso && (
                    <BarraProgreso
                      className="mt-2.5"
                      aprobados={progreso.aprobados}
                      total={escenarios.length}
                      requeridos={progreso.requeridos}
                      aprobado={progreso.aprobado}
                      etiqueta={`Avance de ${seccion.titulo}`}
                    />
                  )}
                </div>
              </>
            )

            const clases = 'flex flex-col rounded-lg border p-5 transition'

            // Las secciones sin escenarios se distinguen por la superficie y la
            // insignia, no bajando la opacidad: atenuar el texto lo dejaría por
            // debajo del contraste mínimo.
            return disponible ? (
              <Link
                key={seccion.id}
                to={`/seccion/${seccion.id}`}
                className={`${clases} border-hairline-strong bg-surface hover:-translate-y-0.5 hover:border-link/40 hover:shadow-card`}
              >
                {contenido}
              </Link>
            ) : (
              <div key={seccion.id} className={`${clases} border-hairline-strong bg-canvas-soft`}>
                {contenido}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

export default Dashboard
