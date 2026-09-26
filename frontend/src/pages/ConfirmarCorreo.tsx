import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import { ApiError, confirmEmail } from '../lib/api'

type Estado = 'confirmando' | 'listo' | 'error'

// Confirmar un correo NO es idempotente (a diferencia de verificar un
// certificado, ver Verificar.tsx): el backend borra el token la primera vez
// que se usa. Con <StrictMode> el efecto de abajo corre dos veces en
// desarrollo, y en producción el mismo enlace puede abrirse dos veces (un
// cliente de correo que precarga el link para la vista previa, y luego el
// usuario lo abre de nuevo). Sin compartir la petición, la segunda llamada
// llega con el token ya borrado y el backend responde 401 aunque la cuenta
// ya haya quedado confirmada por la primera.
//
// Un Map a nivel de módulo (fuera del componente, así sobrevive a que
// StrictMode desmonte y vuelva a montar) recuerda la promesa en curso por
// token y la reutiliza en vez de disparar una segunda petición HTTP.
const confirmacionesEnVuelo = new Map<string, Promise<null>>()

function confirmarUnaVez(token: string): Promise<null> {
  let promise = confirmacionesEnVuelo.get(token)
  if (!promise) {
    promise = confirmEmail(token).finally(() => {
      confirmacionesEnVuelo.delete(token)
    })
    confirmacionesEnVuelo.set(token, promise)
  }
  return promise
}

function ConfirmarCorreo() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [estado, setEstado] = useState<Estado>('confirmando')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false

    confirmarUnaVez(token)
      .then(() => {
        if (!cancelled) setEstado('listo')
      })
      .catch((confirmError) => {
        if (cancelled) return
        setError(
          confirmError instanceof ApiError
            ? confirmError.message
            : 'No se pudo conectar con el servidor.',
        )
        setEstado('error')
      })

    return () => {
      cancelled = true
    }
  }, [token])

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

  if (estado === 'confirmando') {
    return (
      <AuthLayout
        folio="CONFIRMAR CORREO"
        titulo="Confirmando…"
        subtitulo=""
        pie={null}
      >
        <p className="mt-6 text-base text-body">Un momento.</p>
      </AuthLayout>
    )
  }

  if (estado === 'listo') {
    return (
      <AuthLayout
        folio="CONFIRMAR CORREO"
        titulo="Listo"
        subtitulo="Confirmamos tu correo."
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
