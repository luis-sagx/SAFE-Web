import { Link, Navigate, useParams } from 'react-router-dom'
import { escenariosDeSeccion, getSeccion } from '../data/catalogo'

function Seccion() {
  const { seccionId } = useParams()
  const seccion = getSeccion(seccionId)

  if (!seccion) {
    return <Navigate to="/dashboard" replace />
  }

  const escenarios = escenariosDeSeccion(seccion.id)

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-hairline">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <Link to="/dashboard" className="text-sm font-medium text-link hover:underline">
            ← Volver
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <span className="flex size-10 items-center justify-center rounded-md bg-surface-strong text-link">
          <seccion.Icono aria-hidden className="size-5" strokeWidth={1.75} />
        </span>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink">{seccion.titulo}</h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-body">{seccion.descripcion}</p>

        {escenarios.length === 0 ? (
          <p className="mt-10 rounded-lg border border-hairline-strong bg-surface p-5 text-base text-body">
            Estamos preparando los escenarios de esta sección.
          </p>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {escenarios.map((escenario) => (
              <Link
                key={escenario.id}
                to={`/seccion/${escenario.seccionId}/${escenario.escenarioId}`}
                className="rounded-lg border border-hairline-strong bg-surface p-5 transition hover:-translate-y-0.5 hover:border-link/40 hover:shadow-card"
              >
                <h2 className="text-lg font-semibold text-ink">{escenario.titulo}</h2>
                <p className="mt-2 text-base leading-relaxed text-body">{escenario.descripcion}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Seccion
