import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/Campo'
import { ApiError, resetPassword } from '../lib/api'

// Misma política que RegisterDto en el backend (duplicada a propósito, igual
// que NAME_PATTERN en Registro.tsx: no hay ningún endpoint al que consultarla
// antes de enviar el formulario).
const PASSWORD_POLICY = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
const PASSWORD_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres, con una mayúscula, un número y un carácter especial.'

function RestablecerPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!PASSWORD_POLICY.test(password)) {
      setError(PASSWORD_MESSAGE)
      return
    }

    setSubmitting(true)

    try {
      await resetPassword(token as string, password)
      setDone(true)
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : 'No se pudo conectar con el servidor.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <AuthLayout
        folio="RESTABLECER CONTRASEÑA"
        titulo="Este enlace no es válido"
        subtitulo="Puede que ya se haya usado, o que esté incompleto."
        pie={null}
      >
        <p className="mt-6 text-base text-body">
          <Link to="/olvide-password" className="font-medium text-link underline">
            Pedir uno nuevo
          </Link>
        </p>
      </AuthLayout>
    )
  }

  if (done) {
    return (
      <AuthLayout
        folio="RESTABLECER CONTRASEÑA"
        titulo="Listo"
        subtitulo="Tu contraseña se actualizó."
        pie={null}
      >
        <p className="mt-6 text-base text-body">
          <Link to="/login" className="font-medium text-link underline">
            Ir a iniciar sesión
          </Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      folio="RESTABLECER CONTRASEÑA"
      titulo="Elige una contraseña nueva"
      subtitulo="Válida solo para esta cuenta y por los próximos 30 minutos."
      pie={
        error === 'El enlace no es válido o ya venció.' ? (
          <p className="mt-6 text-base text-body">
            <Link to="/olvide-password" className="font-medium text-link underline">
              Pedir uno nuevo
            </Link>
          </p>
        ) : null
      }
    >
      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        <Field
          id="password"
          label="Contraseña nueva"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
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
          {submitting ? 'Cambiando…' : 'Cambiar contraseña'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default RestablecerPassword
