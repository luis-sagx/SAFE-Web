import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Campo from '../components/Campo'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { isAuthenticated, loading, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
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
      await login(email, password)
      navigate('/dashboard')
    } catch (submitError) {
      setError((submitError as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Entrar</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
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
          id="password"
          label="Contraseña"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          maxLength={128}
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
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-base text-body">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-medium text-link hover:underline">
          Regístrate
        </Link>
      </p>
    </main>
  )
}

export default Login
