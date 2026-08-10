import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import Campo from '../components/Campo'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { isAuthenticated, loading, isSupervisor, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return <p className="p-10 text-base text-muted">Cargando…</p>
  }

  if (isAuthenticated) {
    return <Navigate to={isSupervisor ? '/admin' : '/dashboard'} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const perfil = await login(email, password)
      navigate(perfil.role === 'SUPERVISOR' ? '/admin' : '/dashboard')
    } catch (submitError) {
      setError((submitError as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      titulo="Entrar"
      subtitulo="Con el correo que usaste al registrarte."
      pie={
        <p className="mt-6 text-base text-body">
          ¿Es tu primera vez?{' '}
          <Link to="/registro" className="font-medium text-link underline">
            Crear una cuenta
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        <Campo
          id="email"
          label="Correo"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          placeholder="tu@correo.com"
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
    </AuthLayout>
  )
}

export default Login
