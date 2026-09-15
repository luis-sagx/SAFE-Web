import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface Props {
  titulo: string
  aprobados: number
  onClose: () => void
  onConfirm: () => void
  total?: number
  busy?: boolean
  error?: string | null
}

export default function ConfirmReplayModal({ titulo: title, aprobados: approvedCount, onClose, onConfirm, total = 8, busy = false, error }: Props) {
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    close.current?.focus()
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [onClose])
  return <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    <button type="button" aria-label="Cerrar" onClick={onClose} className="fixed inset-0 bg-scrim" />
    <div role="dialog" aria-modal="true" aria-labelledby="titulo-repeticion" className="relative z-10 w-full max-w-lg rounded-lg bg-canvas p-6 shadow-card">
      <button ref={close} type="button" aria-label="Cerrar" onClick={onClose} className="absolute right-3 top-3 text-muted"><X aria-hidden /></button>
      <h2 id="titulo-repeticion" className="text-xl font-semibold text-ink">Repetir el módulo de {title}</h2>
      <p className="mt-3 text-base leading-relaxed text-body">Vas a volver a jugar los <strong>{total} escenarios</strong> de este módulo, en orden. No se puede repetir uno suelto.</p>
      <p className="mt-3 text-base leading-relaxed text-body">Tu avance actual (<strong>{approvedCount}/{total}</strong>) se reinicia a <strong>0/{total}</strong>. Los intentos anteriores quedan en el historial, pero ya no cuentan para la nota del módulo.</p>
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
      <div className="mt-6 flex gap-3"><button type="button" onClick={onConfirm} disabled={busy} className="min-h-11 flex-1 rounded-md bg-primary px-4 py-2 font-medium text-on-primary disabled:opacity-60">{busy ? 'Reiniciando…' : 'Reiniciar módulo'}</button><button type="button" onClick={onClose} disabled={busy} className="min-h-11 rounded-md border border-hairline-strong px-4 py-2 text-body">Ahora no</button></div>
    </div>
  </div>
}
