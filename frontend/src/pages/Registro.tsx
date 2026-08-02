import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Campo from '../components/Campo'
import { useAuth } from '../context/AuthContext'

function Registro() {
  const { isAuthenticated, loading, register } = useAuth()
  const navigate = useNavigate()

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return <p className="p-10 text-base text-muted">Cargando…</p>
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await register({ nombre, email, telefono, password })
      navigate('/dashboard')
    } catch (submitError) {
      setError((submitError as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Crear cuenta</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <Campo
          id="nombre"
          label="Nombre"
          value={nombre}
          onChange={setNombre}
          autoComplete="name"
          maxLength={80}
        />
        <Campo
          id="email"
          label="Correo"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          maxLength={120}
        />
        <Campo
          id="telefono"
          label="Teléfono"
          type="tel"
          value={telefono}
          onChange={setTelefono}
          autoComplete="tel"
          maxLength={20}
        />
        <Campo
          id="password"
          label="Contraseña"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          maxLength={128}
          ayuda="Mínimo 8 caracteres."
        />

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="h-11 w-full rounded-md bg-primary text-sm font-medium text-on-primary transition hover:bg-primary-active disabled:opacity-60"
        >
          {submitting ? 'Creando…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-6 text-base text-body">
        ¿Ya tienes cuenta?{' '}
        <Link to="/" className="font-medium text-link hover:underline">
          Entrar
        </Link>
      </p>

      <p className="mt-8 text-sm text-muted">
        Tus datos se usan solo para darte acceso. Los resultados del
        entrenamiento se analizan de forma anónima.
      </p>
    </main>
  )
}

export default Registro
