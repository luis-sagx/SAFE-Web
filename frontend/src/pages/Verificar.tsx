import { CheckCircle2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { verifyCertificate, type CertificateVerification } from '../lib/api'

// Verificación pública (sin sesión ni nombre, §5.6): el PDF ya trae el nombre; aquí solo se confirma que el código es real y no fue revocado.
function VerifyCertificate() {
  const { codigo: code } = useParams()
  const [result, setResult] = useState<CertificateVerification | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!code) return
    let cancelled = false

    verifyCertificate(code)
      .then((r) => {
        if (!cancelled) setResult(r)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })

    return () => {
      cancelled = true
    }
  }, [code])

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-12">
      <div className="w-full max-w-md rounded-lg border border-hairline-strong bg-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.88px] text-muted">
          Verificación de certificado
        </p>
        <p className="mt-1 font-mono text-sm text-body">{code}</p>

        {error && (
          <p className="mt-4 text-base text-body">
            No se pudo verificar el código. Vuelve a intentarlo más tarde.
          </p>
        )}

        {!error && result === null && <p className="mt-4 text-base text-muted">Verificando…</p>}

        {!error && result !== null && result.valido && (
          <div className="mt-4">
            <p className="flex items-center gap-1.5 text-base font-semibold text-success-ink">
              <CheckCircle2 aria-hidden className="size-5" strokeWidth={2.5} />
              Certificado válido
            </p>
            <p className="mt-3 text-base leading-relaxed text-body">
              Emitido el{' '}
              {new Date(result.emitidoAt ?? '').toLocaleDateString('es-EC', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              , con una duración de {result.horas} horas.
            </p>
            {result.modulos && (
              <p className="mt-2 text-sm text-muted">Módulos: {result.modulos.join(', ')}</p>
            )}
          </div>
        )}

        {!error && result !== null && !result.valido && (
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

export default VerifyCertificate
