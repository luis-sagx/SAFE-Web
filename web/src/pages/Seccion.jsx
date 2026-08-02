import { Link, Navigate, useParams } from 'react-router-dom'
import { useParticipant } from '../context/ParticipantContext.jsx'
import { getSeccion } from '../data/secciones.js'

function Seccion() {
  const { profile } = useParticipant()
  const { seccionId } = useParams()
  const seccion = getSeccion(seccionId)

  if (!profile) {
    return <Navigate to="/" replace />
  }

  if (!seccion) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link to="/dashboard" className="text-sm font-semibold text-sky-600 hover:underline">
        ← Volver al dashboard
      </Link>

      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sky-600">{seccion.tag}</p>
      <h2 className="text-2xl font-bold text-slate-900">{seccion.titulo}</h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {seccion.escenarios.map((escenario) => (
          <Link
            key={escenario.id}
            to={`/seccion/${seccion.id}/${escenario.id}`}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h3 className="text-lg font-bold text-slate-900">{escenario.titulo}</h3>
            <p className="mt-2 text-sm text-slate-600">{escenario.descripcion}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}

export default Seccion
