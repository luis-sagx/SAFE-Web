import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/Campo'
import { ApiError, forgotPassword } from '../lib/api'

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function OlvidePassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // La respuesta es la misma exista o no la cuenta (issue #256): este estado
  // se activa siempre que la petición llega a responder, sin importar el
  // resultado, para no delatar nada con el "sí"/"no" de la UI.
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!EMAIL_FORMAT.test(email)) {
      setError('El correo no tiene un formato válido.')
      return
    }

    setSubmitting(true)

    try {
      await forgotPassword(email)
      setSent(true)
    } catch (submitError) {
      // Un error real (red caída, 500, demasiados intentos) sí se muestra:
      // lo que nunca se distingue es "existe" de "no existe".
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : 'No se pudo conectar con el servidor.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      folio="RECUPERAR ACCESO"
      titulo="¿Olvidaste tu contraseña?"
      subtitulo="Escribe el correo con el que te registraste."
      pie={
        <p className="mt-6 text-base text-body">
          <Link to="/login" className="font-medium text-link underline">
            Volver a iniciar sesión
          </Link>
        </p>
      }
    >
      {sent ? (
        <p className="mt-6 text-base text-body">
          Si ese correo tiene una cuenta, te enviamos un enlace para elegir una
          contraseña nueva. Revisa tu bandeja (y la de spam) — el enlace vence
          en 30 minutos.
        </p>
      ) : (
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
            {submitting ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}

export default OlvidePassword
