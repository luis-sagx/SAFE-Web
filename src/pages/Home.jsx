import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useParticipant } from '../context/ParticipantContext.jsx'

function Home() {
  const { profile, saveProfile } = useParticipant()
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = location.state?.prefill

  const [displayName, setDisplayName] = useState(prefill?.displayName ?? '')
  const [roleName, setRoleName] = useState(prefill?.roleName ?? '')

  if (profile && !prefill) {
    return <Navigate to="/dashboard" replace />
  }

  function handleSubmit(event) {
    event.preventDefault()
    const trimmedName = displayName.trim()

    if (!trimmedName) {
      return
    }

    saveProfile({ displayName: trimmedName, roleName: roleName.trim() })
    navigate('/dashboard')
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-10 px-6 py-12 lg:flex-row lg:items-center">
      <div className="flex-1 space-y-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
          MIC · Simulador de entrenamiento
        </p>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          Practica como si fuera real, pero sin exponer datos reales.
        </h1>
        <p className="text-slate-600">
          Este acceso es solo de prueba. No valida identidad ni contraseña. Ingresa un nombre o
          apodo para personalizar la experiencia y, si quieres, un rol o área.
        </p>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>El nombre o apodo puede ser real o inventado.</li>
          <li>El rol o área es opcional y también puede ser real o ficticio.</li>
          <li>La idea es entrenar criterio, no recopilar información personal.</li>
        </ul>
      </div>

      <section className="flex-1 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <span className="inline-block rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
          Acceso de prueba
        </span>
        <h2 className="mt-3 text-xl font-bold text-slate-900">Entrar al entrenamiento</h2>
        <p className="mt-2 text-sm text-slate-600">
          Como en un quiz de phishing, aquí solo necesitamos un identificador simple para comenzar
          la simulación.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-700">
              Nombre o apodo
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              maxLength={40}
              required
              placeholder="Ej. Vale, Alex, Usuario 01"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label htmlFor="roleName" className="block text-sm font-medium text-slate-700">
              Rol o área (opcional)
            </label>
            <input
              id="roleName"
              name="roleName"
              type="text"
              maxLength={50}
              placeholder="Ej. Finanzas, Compras, Soporte"
              value={roleName}
              onChange={(event) => setRoleName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              Si después quieres medir resultados por perfil, este segundo dato ayuda. Si no,
              puedes dejarlo vacío sin afectar la experiencia.
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Entrar a la prueba
          </button>
        </form>
      </section>
    </main>
  )
}

export default Home
