import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useParticipant } from '../context/ParticipantContext.jsx'
import { SECCIONES } from '../data/secciones.js'

function Dashboard() {
  const { profile } = useParticipant()
  const navigate = useNavigate()

  if (!profile) {
    return <Navigate to="/" replace />
  }

  function handleChangeData() {
    // No se borra el perfil actual todavía: si el participante abandona el
    // formulario sin reenviarlo, conserva su sesión en vez de perderla.
    // El propio "prefill" en el state es lo que evita que Home rebote de
    // nuevo al dashboard mientras el perfil sigue presente.
    navigate('/', { state: { prefill: profile } })
  }

  const roleText = profile.roleName
    ? ` Perfil elegido: ${profile.roleName}.`
    : ' No agregaste un rol o area, y esta bien para una simulacion simple.'

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
            Secciones disponibles
          </p>
          <h2 className="text-2xl font-bold text-slate-900">Bienvenido/a, {profile.displayName}</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Este entrenamiento es solo de practica. Puedes entrar a cualquiera de las seis
            secciones.{roleText}
          </p>
        </div>
        <button
          type="button"
          onClick={handleChangeData}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cambiar datos
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECCIONES.map((seccion, index) => (
          <Link
            key={seccion.id}
            to={`/seccion/${seccion.id}`}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Sección {index + 1}
              </span>
              <h3 className="mt-1 text-lg font-bold text-slate-900">{seccion.titulo}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {seccion.estado === 'proximamente'
                  ? 'Próximamente.'
                  : `${seccion.escenarios.length} escenario${seccion.escenarios.length > 1 ? 's' : ''} disponible${seccion.escenarios.length > 1 ? 's' : ''}.`}
              </p>
            </div>
            <span className="mt-4 inline-block w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {seccion.tag}
            </span>
          </Link>
        ))}
      </div>
    </main>
  )
}

export default Dashboard
