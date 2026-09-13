import { useState } from 'react'
import { ApiError, downloadCertificatePdf, issueCertificate, fetchAttestation } from '../lib/api'

type Status = 'idle' | 'generando' | 'error'

// Aparece solo cuando se aprobaron todos los módulos que declara el servidor (THRESHOLDS),
// nunca un número fijo. Tres peticiones seguidas (atestación, canje, PDF) porque progreso
// y nombre viven en servicios distintos (§5.2); la atestación firmada es lo único que cruza.
function CertificateButton() {
  const [status, setStatus] = useState<Status>('idle')

  async function download() {
    setStatus('generando')
    try {
      const { atestacion: attestation } = await fetchAttestation()
      await issueCertificate(attestation)
      const pdf = await downloadCertificatePdf(attestation)

      // Descarga real del navegador: la URL del blob solo vive en esta
      // pestaña, y se libera apenas el enlace hizo su trabajo.
      const url = URL.createObjectURL(pdf)
      const link = document.createElement('a')
      link.href = url
      link.download = 'certificado-safe-web.pdf'
      link.click()
      URL.revokeObjectURL(url)

      setStatus('idle')
    } catch (error) {
      setStatus('error')
      // 409: el progreso cambió justo entre cargar el dashboard y pulsar el
      // botón (p. ej. otra pestaña bajó una nota). El mensaje del servidor ya
      // lo explica; no hace falta uno propio.
      if (!(error instanceof ApiError)) {
        // eslint-disable-next-line no-console -- ayuda a depurar en producción
        console.error(error)
      }
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => void download()}
        disabled={status === 'generando'}
        className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-on-primary transition hover:bg-primary-active disabled:cursor-default disabled:opacity-70"
      >
        {status === 'generando' ? 'Generando…' : 'Descargar certificado'}
      </button>

      {status === 'error' && (
        <p className="mt-2 text-sm text-danger">
          No se pudo generar el certificado. Vuelve a intentarlo en un momento.
        </p>
      )}
    </div>
  )
}

export default CertificateButton
