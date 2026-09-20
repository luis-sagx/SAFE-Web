import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import LoadingScreen from '../components/PantallaCarga'
import Field from '../components/Campo'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { isAuthenticated, loading, isAdmin, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const invalidEmail = email.length > 0 && !EMAIL_FORMAT.test(email)

  if (loading) {
    return <LoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!EMAIL_FORMAT.test(email)) {
      setError('El correo no tiene un formato válido.')
      return
    }

    if (!password) {
      setError('Ingresa tu contraseña para continuar.')
      return
    }

    setSubmitting(true)

    try {
      const profile = await login(email, password)
      navigate(profile.role === 'ADMIN' ? '/admin' : '/dashboard')
    } catch (submitError) {
      setError((submitError as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      folio="ACCESO"
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
        <Field
          id="email"
          label="Correo"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          placeholder="tu@correo.com"
          maxLength={120}
          error={invalidEmail ? 'El correo no tiene un formato válido.' : undefined}
        />
        <Field
          id="password"
          label="Contraseña"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          maxLength={128}
        />

        <p className="text-right text-sm">
          <Link to="/olvide-password" className="font-medium text-link underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>

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
