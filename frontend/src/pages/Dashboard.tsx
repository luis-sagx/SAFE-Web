import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { escenariosDeSeccion, SECCIONES } from '../data/catalogo'
import { fetchMyRuns } from '../lib/api'

function Dashboard() {
  const { displayName, logout } = useAuth()
  const [completados, setCompletados] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false

    fetchMyRuns()
      .then((runs) => {
        if (!cancelled) setCompletados(new Set(runs.map((run) => run.scenarioId)))
      })
      .catch(() => {
        // El progreso es informativo: si no carga, el dashboard sigue usable.
      })

    return () => {
      cancelled = true
    }
  }, [])

  const total = SECCIONES.reduce((suma, s) => suma + escenariosDeSeccion(s.id).length, 0)

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold text-ink">Trampa Digital</span>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-body sm:inline">{displayName}</span>
            <button
              type="button"
              onClick={logout}
              className="h-9 rounded-md border border-hairline-strong bg-surface px-3 text-sm font-medium text-ink transition hover:bg-surface-strong"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

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

        {total > 0 && (
          <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-surface-strong px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.88px] text-ink">
            <CheckCircle2 aria-hidden className="size-3.5 text-link" strokeWidth={2.5} />
            {completados.size} de {total} escenarios completados
          </p>
        )}

        {/* Tres columnas como máximo: las seis secciones se reparten en dos
            filas exactas. Con cuatro quedaba una fila coja. */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECCIONES.map((seccion) => {
            const escenarios = escenariosDeSeccion(seccion.id)
            const listos = escenarios.filter((e) => completados.has(e.id)).length
            const disponible = escenarios.length > 0

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
                  {disponible && listos === escenarios.length && (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.88px] text-success">
                      Completo
                    </span>
                  )}
                </div>

                <h2 className="mt-4 text-lg font-semibold text-ink">{seccion.titulo}</h2>
                <p className="mt-2 flex-1 text-base leading-relaxed text-body">
                  {seccion.descripcion}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-hairline pt-3">
                  <span className="text-sm text-muted">{seccion.canal}</span>
                  {disponible && (
                    <span className="text-sm font-medium text-ink">
                      {listos}/{escenarios.length}
                    </span>
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
