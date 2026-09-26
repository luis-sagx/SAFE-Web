import { Loader2, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import Modal from './Modal'

export interface Confirmation {
  titulo: string
  mensaje: string
  /// Texto del botón que confirma ("Sí, desactivar").
  etiqueta: string
  Icono: LucideIcon
  /// true pinta el botón de confirmar en rojo (acción destructiva).
  peligro?: boolean
  /// Si lanza, el modal sigue abierto y muestra el error; si termina bien, se cierra.
  accion: () => Promise<void>
}

interface Props {
  confirmation: Confirmation
  onClose: () => void
}

export default function ConfirmDialog({ confirmation, onClose }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { Icono: Icon } = confirmation

  async function confirm() {
    setBusy(true)
    setError('')
    try {
      await confirmation.accion()
      onClose()
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <Modal titulo={confirmation.titulo} onClose={onClose} busy={busy}>
      <p className="mt-2 text-sm leading-relaxed text-body">{confirmation.mensaje}</p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="h-9 rounded-md border border-hairline-strong bg-surface px-3 text-sm font-medium text-ink transition hover:bg-surface-strong disabled:opacity-50"
        >
          No, cancelar
        </button>
        <button
          type="button"
          onClick={() => void confirm()}
          disabled={busy}
          className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-on-primary transition disabled:opacity-60 ${
            confirmation.peligro ? 'bg-danger hover:opacity-90' : 'bg-primary hover:bg-primary-active'
          }`}
        >
          {busy ? (
            <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
          ) : (
            <Icon aria-hidden className="size-4" strokeWidth={1.75} />
          )}
          {confirmation.etiqueta}
        </button>
      </div>
    </Modal>
  )
}
