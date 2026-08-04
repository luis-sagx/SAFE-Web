import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import Campo from '../components/Campo'
import { useAuth } from '../context/AuthContext'
import { esCedulaEcuatoriana, normalizarCedula } from '../lib/cedula'

function Registro() {
  const { isAuthenticated, loading, register } = useAuth()
  const navigate = useNavigate()

  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [cedula, setCedula] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Solo se avisa de la cédula cuando ya está completa: marcarla en rojo
  // mientras la escribe convierte cada tecla en un reproche.
  const cedulaLimpia = normalizarCedula(cedula)
  const cedulaInvalida = cedulaLimpia.length === 10 && !esCedulaEcuatoriana(cedulaLimpia)

  if (loading) {
    return <p className="p-10 text-base text-muted">Cargando…</p>
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    // El backend valida igual; esto solo evita un viaje al servidor.
    if (!esCedulaEcuatoriana(cedulaLimpia)) {
      setError('Revisa tu número de cédula: son 10 dígitos.')
      return
    }

    setSubmitting(true)

    try {
      await register({ nombre, apellido, email, cedula: cedulaLimpia, password })
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
          <Link to="/" className="font-medium text-link underline">
            Entrar
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Campo
            id="nombre"
            label="Nombre"
            value={nombre}
            onChange={setNombre}
            autoComplete="given-name"
            placeholder="María"
            maxLength={60}
          />
          <Campo
            id="apellido"
            label="Apellido"
            value={apellido}
            onChange={setApellido}
            autoComplete="family-name"
            placeholder="Pérez"
            maxLength={60}
          />
        </div>
        <Campo
          id="cedula"
          label="Cédula"
          value={cedula}
          onChange={setCedula}
          inputMode="numeric"
          autoComplete="off"
          placeholder="1710034065"
          maxLength={13}
          ayuda="No se guarda; solo evita cuentas repetidas."
          error={cedulaInvalida ? 'Ese número de cédula no es válido.' : undefined}
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
