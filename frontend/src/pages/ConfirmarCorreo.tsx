import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'

// Confirmar NO ocurre al cargar la página, sino al pulsar el botón: el backend
// gasta el token en el primer uso y, además, abre sesión. Los escáneres de
// enlaces de algunos correos (Outlook, antivirus) abren el link por su cuenta
// y ejecutan el JavaScript; si la página confirmara sola, gastarían el token
// (y se quedarían con la sesión) antes de que la persona haga clic.
function ConfirmarCorreo() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { confirmEmail } = useAuth()
  const navigate = useNavigate()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    if (!token) return
    setSubmitting(true)
    setError('')

    try {
      const profile = await confirmEmail(token)
      void navigate(profile.role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true })
    } catch (confirmError) {
      setError(
        confirmError instanceof ApiError
          ? confirmError.message
          : 'No se pudo conectar con el servidor.',
      )
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <AuthLayout
        folio="CONFIRMAR CORREO"
        titulo="Este enlace no es válido"
        subtitulo="Puede que esté incompleto."
        pie={null}
      >
        <p className="mt-6 text-base text-body">
          <Link to="/revisa-tu-correo" className="font-medium text-link underline">
            Volver
          </Link>
        </p>
      </AuthLayout>
    )
  }

  if (!error) {
    return (
      <AuthLayout
        folio="CONFIRMAR CORREO"
        titulo="Confirma tu correo"
        subtitulo="Un clic y entras a tu cuenta."
        pie={null}
      >
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={submitting}
          className="mt-6 h-11 w-full rounded-md bg-primary text-sm font-medium text-on-primary transition hover:bg-primary-active disabled:opacity-60"
        >
          {submitting ? 'Entrando…' : 'Confirmar y entrar'}
        </button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      folio="CONFIRMAR CORREO"
      titulo="No pudimos confirmar tu correo"
      subtitulo=""
      pie={null}
    >
      <p role="alert" className="mt-6 text-sm text-danger">
        {error}
      </p>
      <p className="mt-4 text-base text-body">
        <Link to="/revisa-tu-correo" className="font-medium text-link underline">
          Pedir un enlace nuevo
        </Link>
      </p>
    </AuthLayout>
  )
}

export default ConfirmarCorreo
