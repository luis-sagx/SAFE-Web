import { useState } from 'react'
import { ApiError, downloadCertificatePdf, issueCertificate, fetchAttestation } from '../lib/api'

type Status = 'idle' | 'generando' | 'error'
type DownloadMode = 'issue' | 'download' | 'expand'

interface CertificateButtonProps {
  mode?: DownloadMode
  onIssued?: (modules: string[]) => void
}

async function prepareDownload(mode: DownloadMode, onIssued?: CertificateButtonProps['onIssued']) {
  if (mode === 'download') return undefined
  try {
    const { atestacion } = await fetchAttestation()
    const certificate = await issueCertificate(atestacion)
    onIssued?.(certificate.modulos)
    return atestacion
  } catch (error) {
    // Si la ampliación falla, identidad todavía puede entregar el certificado vigente.
    if (mode !== 'expand') throw error
    return undefined
  }
}

function CertificateButton({ mode = 'issue', onIssued }: Readonly<CertificateButtonProps>) {
  const [status, setStatus] = useState<Status>('idle')

  async function download() {
    setStatus('generando')
    try {
      const attestation = await prepareDownload(mode, onIssued)
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
        <p className="w-full text-sm text-danger">
          No se pudo generar el certificado. Vuelve a intentarlo en un momento.
        </p>
      )}

    </div>
  )
}

export default CertificateButton
