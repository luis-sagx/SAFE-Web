import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { escenariosDeSeccion, SECCIONES } from '../data/catalogo'

function Dashboard() {
  const { displayName, roleLabel, logout } = useAuth()

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
            Secciones disponibles
          </p>
          <h2 className="text-2xl font-bold text-slate-900">Participante {displayName}</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Puedes entrar a cualquier sección y repetir los escenarios las veces que quieras.
            Grupo: {roleLabel}.
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Salir
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECCIONES.map((seccion, index) => {
          const total = escenariosDeSeccion(seccion.id).length

          return (
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
                  {total === 0
                    ? 'Próximamente.'
                    : `${total} escenario${total > 1 ? 's' : ''} disponible${total > 1 ? 's' : ''}.`}
                </p>
              </div>
              <span className="mt-4 inline-block w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {seccion.tag}
              </span>
            </Link>
          )
        })}
      </div>
    </main>
  )
}

export default Dashboard
