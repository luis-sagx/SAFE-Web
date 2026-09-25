import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

interface Props {
  titulo: string
  onClose: () => void
  /// Mientras hay una acción en curso no se cierra: ni con Escape, ni con el
  /// fondo, ni con la X. Evita dejar una petición a medias sin respuesta visible.
  busy?: boolean
  children: ReactNode
}

/// Mismo patrón que los demás modales de la app (div role="dialog" sobre un
/// fondo que cierra al pulsarlo). Quien lo usa decide cuándo montarlo.
export default function Modal({ titulo: title, onClose, busy = false, children }: Props) {
  const titleId = useId()
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeButton.current?.focus()
  }, [])

  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose()
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [onClose, busy])

  const close = () => {
    if (!busy) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button type="button" aria-label="Cerrar" tabIndex={-1} onClick={close} className="fixed inset-0 bg-scrim" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-hairline-strong bg-surface p-6 text-ink shadow-card"
      >
        <button
          ref={closeButton}
          type="button"
          aria-label="Cerrar"
          onClick={close}
          disabled={busy}
          className="absolute right-3 top-3 rounded-md p-1 text-muted transition hover:bg-surface-strong disabled:opacity-50"
        >
          <X aria-hidden className="size-5" />
        </button>
        <h2 id={titleId} className="pr-8 text-lg font-semibold text-ink">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
