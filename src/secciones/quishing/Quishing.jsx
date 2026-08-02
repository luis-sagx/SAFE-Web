import { Link } from 'react-router-dom'

function Quishing() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Quishing</p>
      <h2 className="mt-2 text-xl font-bold text-slate-900">Próximamente</h2>
      <p className="mt-2 text-sm text-slate-600">
        Estamos preparando escenarios de códigos QR maliciosos para esta sección.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-block text-sm font-semibold text-sky-600 hover:underline"
      >
        ← Volver al dashboard
      </Link>
    </main>
  )
}

export default Quishing
