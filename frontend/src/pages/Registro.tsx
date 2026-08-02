import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import AuthLayout from '../components/AuthLayout'
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
    <AuthLayout
      titulo="Crear cuenta"
      subtitulo="Solo para darte acceso. Tus resultados se analizan de forma anónima."
      pie={
        <p className="mt-6 text-base text-body">
          ¿Ya tienes cuenta?{' '}
          <Link to="/" className="font-medium text-link hover:underline">
            Entrar
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        <Campo
          id="nombre"
          label="Nombre"
          value={nombre}
          onChange={setNombre}
          autoComplete="name"
          placeholder="Como quieres que te llamemos"
          maxLength={80}
        />
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
          id="telefono"
          label="Teléfono"
          type="tel"
          value={telefono}
          onChange={setTelefono}
          autoComplete="tel"
          placeholder="09 1234 5678"
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
    </AuthLayout>
  )
}

export default Registro
