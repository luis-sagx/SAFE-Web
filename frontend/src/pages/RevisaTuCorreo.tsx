import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/Campo'
import { ApiError, resendConfirmation } from '../lib/api'

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface LocationState {
  email?: string
}

function RevisaTuCorreo() {
  const location = useLocation()
  const email = (location.state as LocationState | null)?.email

  const [sending, setSending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState('')

  // Sin `state.email` (recarga de página, entrada directa a la URL, o el
  // enlace "Pedir un enlace nuevo" de ConfirmarCorreo, que navega aquí sin
  // pasar state): sin esto no había ninguna forma de reenviar, y una cuenta
  // con el link vencido o cuyo correo nunca llegó quedaba bloqueada para
  // siempre (no se puede reregistrar, da 409 por cédula/correo duplicados).
  const [manualEmail, setManualEmail] = useState('')
  const [manualError, setManualError] = useState('')

  async function handleResend() {
    if (!email) return
    setSending(true)
    setError('')

    try {
      await resendConfirmation(email)
      setResent(true)
    } catch (resendError) {
      setError(
        resendError instanceof ApiError
          ? resendError.message
          : 'No se pudo conectar con el servidor.',
      )
    } finally {
      setSending(false)
    }
  }

  async function handleManualSubmit(event: FormEvent) {
    event.preventDefault()
    setManualError('')

    if (!EMAIL_FORMAT.test(manualEmail)) {
      setManualError('El correo no tiene un formato válido.')
      return
    }

    setSending(true)

    try {
      await resendConfirmation(manualEmail)
      setResent(true)
    } catch (resendError) {
      // Igual que en OlvidePassword: un error real de red/servidor sí se
      // muestra, pero el mensaje de éxito nunca distingue si la cuenta
      // existe o ya está confirmada.
      setManualError(
        resendError instanceof ApiError
          ? resendError.message
          : 'No se pudo conectar con el servidor.',
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthLayout
      folio="REGISTRO"
      titulo="Revisa tu correo"
      subtitulo={
        email
          ? `Te mandamos un enlace de confirmación a ${email}.`
          : 'Te mandamos un enlace de confirmación a tu correo.'
      }
      pie={
        <p className="mt-6 text-base text-body">
          <Link to="/login" className="font-medium text-link underline">
            Ya confirmé, ir a iniciar sesión
          </Link>
        </p>
      }
    >
      <p className="mt-6 text-base text-body">
        Haz clic en el enlace del correo para poder iniciar sesión. El enlace
        vence en 24 horas.
      </p>

      {email && (
        <div className="mt-6">
          {resent ? (
            <p className="text-sm text-success-ink">Te lo volvimos a mandar.</p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={sending}
              className="text-sm font-medium text-link underline disabled:opacity-60"
            >
              {sending ? 'Enviando…' : '¿No te llegó? Reenviar'}
            </button>
          )}
          {error && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      )}

      {!email && (
        <div className="mt-6">
          {resent ? (
            <p className="text-sm text-success-ink">
              Si ese correo tiene una cuenta pendiente de confirmar, te
              mandamos un enlace nuevo.
            </p>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4" noValidate>
              <Field
                id="email"
                label="Correo"
                type="email"
                value={manualEmail}
                onChange={setManualEmail}
                autoComplete="email"
                placeholder="tu@correo.com"
                maxLength={120}
              />

              {manualError && (
                <p role="alert" className="text-sm text-danger">
                  {manualError}
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="h-11 w-full rounded-md bg-primary text-sm font-medium text-on-primary transition hover:bg-primary-active disabled:opacity-60"
              >
                {sending ? 'Enviando…' : 'Reenviar enlace'}
              </button>
            </form>
          )}
        </div>
      )}
    </AuthLayout>
  )
}

export default RevisaTuCorreo
