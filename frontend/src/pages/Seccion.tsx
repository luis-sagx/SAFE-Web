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
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link to="/dashboard" className="text-sm font-semibold text-sky-600 hover:underline">
        ← Volver al dashboard
      </Link>

      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sky-600">
        {seccion.tag}
      </p>
      <h2 className="text-2xl font-bold text-slate-900">{seccion.titulo}</h2>

      {escenarios.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          Próximamente. Estamos preparando los escenarios de esta sección.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {escenarios.map((escenario) => (
            <Link
              key={escenario.id}
              to={`/seccion/${escenario.seccionId}/${escenario.escenarioId}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="text-lg font-bold text-slate-900">{escenario.titulo}</h3>
              <p className="mt-2 text-sm text-slate-600">{escenario.descripcion}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}

export default Seccion
