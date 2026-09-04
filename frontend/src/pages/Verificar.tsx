import { CheckCircle2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { verificarCertificado, type VerificacionCertificado } from '../lib/api'

/**
 * Verificación pública del certificado: sin sesión, sin nombre (§5.6 del
 * diseño). Quien llega aquí ya tiene el PDF con el nombre delante; esta
 * pantalla solo confirma que el código es real y no fue revocado.
 */
function Verificar() {
  const { codigo } = useParams()
  const [resultado, setResultado] = useState<VerificacionCertificado | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!codigo) return
    let cancelled = false

    verificarCertificado(codigo)
      .then((r) => {
        if (!cancelled) setResultado(r)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })

    return () => {
      cancelled = true
    }
  }, [codigo])

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-12">
      <div className="w-full max-w-md rounded-lg border border-hairline-strong bg-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.88px] text-muted">
          Verificación de certificado
        </p>
        <p className="mt-1 font-mono text-sm text-body">{codigo}</p>

        {error && (
          <p className="mt-4 text-base text-body">
            No se pudo verificar el código. Vuelve a intentarlo más tarde.
          </p>
        )}

        {!error && resultado === null && <p className="mt-4 text-base text-muted">Verificando…</p>}

        {!error && resultado !== null && resultado.valido && (
          <div className="mt-4">
            <p className="flex items-center gap-1.5 text-base font-semibold text-success">
              <CheckCircle2 aria-hidden className="size-5" strokeWidth={2.5} />
              Certificado válido
            </p>
            <p className="mt-3 text-base leading-relaxed text-body">
              Emitido el{' '}
              {new Date(resultado.emitidoAt ?? '').toLocaleDateString('es-EC', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              , con una duración de {resultado.horas} horas.
            </p>
            {resultado.modulos && (
              <p className="mt-2 text-sm text-muted">Módulos: {resultado.modulos.join(', ')}</p>
            )}
          </div>
        )}

        {!error && resultado !== null && !resultado.valido && (
          <p className="mt-4 flex items-center gap-1.5 text-base font-semibold text-danger">
            <XCircle aria-hidden className="size-5" strokeWidth={2.5} />
            Este código no corresponde a un certificado vigente.
          </p>
        )}

        <Link to="/" className="mt-6 block text-sm font-medium text-link underline">
          ← Ir a SAFE Web
        </Link>
      </div>
    </div>
  )
}

export default Verificar
