import { Download, ExternalLink, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { fetchAttestation, issueCertificate, type Certificate } from '../lib/api'
import { svgAPng } from '../lib/insigniaImagen'
import { buildLinkedInAddToProfileUrl } from '../lib/linkedin'
import CertificateBadge from './ui/InsigniaCertificado'

type Status = 'cargando' | 'lista' | 'error'

interface BadgeModalProps {
  nombre: string | null
  onClose: () => void
}

const BADGE_WIDTH = 320
const BADGE_HEIGHT = 360

// Insignia circular descargable como PNG, aparte del PDF formal (issue #230):
// misma atestación que ya pide CertificadoBoton, pero acá el destino es una
// imagen para compartir (LinkedIn u otra red), no un documento para imprimir.
function BadgeModal({ nombre, onClose }: Readonly<BadgeModalProps>) {
  const [status, setStatus] = useState<Status>('cargando')
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [downloading, setDownloading] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let cancelled = false

    fetchAttestation()
      .then(({ atestacion }) => issueCertificate(atestacion))
      .then((data) => {
        if (cancelled) return
        setCertificate(data)
        setStatus('lista')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    closeRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function download() {
    if (!svgRef.current || downloading) return
    setDownloading(true)
    try {
      const png = await svgAPng(svgRef.current, BADGE_WIDTH, BADGE_HEIGHT)
      const url = URL.createObjectURL(png)
      const link = document.createElement('a')
      link.href = url
      link.download = 'insignia-safeweb.png'
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setStatus('error')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-10 sm:items-center">
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar insignia"
        className="fixed inset-0 cursor-default appearance-none border-0 bg-scrim p-0"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Insignia de SAFE-Web"
        className="relative z-10 w-full max-w-sm rounded-lg bg-canvas p-5 shadow-card"
      >
        <div className="flex justify-end">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar insignia"
            className="inline-flex size-9 items-center justify-center rounded-md text-muted transition hover:bg-surface-strong hover:text-ink"
          >
            <X aria-hidden className="size-[18px]" strokeWidth={1.75} />
          </button>
        </div>

        {status === 'cargando' && (
          <p className="py-10 text-center text-base text-body">Generando tu insignia…</p>
        )}

        {status === 'error' && (
          <p className="py-10 text-center text-base text-danger">
            No se pudo generar la insignia. Inténtalo de nuevo en un momento.
          </p>
        )}

        {status === 'lista' && certificate && (
          <>
            <CertificateBadge
              ref={svgRef}
              nombre={nombre}
              modulos={certificate.modulos}
              horas={certificate.horas}
              className="mx-auto h-auto w-full max-w-[240px]"
            />

            <button
              type="button"
              onClick={() => void download()}
              disabled={downloading}
              className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-lg font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:cursor-default disabled:opacity-70"
            >
              <Download aria-hidden className="size-5" strokeWidth={2} />
              {downloading ? 'Generando…' : 'Descargar insignia'}
            </button>

            <a
              href={buildLinkedInAddToProfileUrl(certificate, window.location.origin)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-border-control px-4 py-3 text-lg font-medium text-ink transition hover:bg-surface-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
            >
              <ExternalLink aria-hidden className="size-5" strokeWidth={2} />
              Agregar a LinkedIn
            </a>
          </>
        )}
      </div>
    </div>
  )
}

export default BadgeModal
