import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'

interface Props {
  seccionId: string
  titulo: string
  aprobados: number
  aprobado: boolean
  onClose: () => void
  onConfirm?: () => void
}

export default function ConfirmarRepeticionModal({ seccionId, titulo, aprobados, aprobado, onClose, onConfirm }: Props) {
  const cerrar = useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()
  useEffect(() => {
    cerrar.current?.focus()
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [onClose])
  const confirmar = onConfirm ?? (() => navigate(`/seccion/${seccionId}`, { state: { iniciarRepeticion: true } }))
  return <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    <button type="button" aria-label="Cerrar" onClick={onClose} className="fixed inset-0 bg-scrim" />
    <div role="dialog" aria-modal="true" aria-labelledby="titulo-repeticion" className="relative z-10 w-full max-w-lg rounded-lg bg-canvas p-6 shadow-card">
      <button ref={cerrar} type="button" aria-label="Cerrar" onClick={onClose} className="absolute right-3 top-3 text-muted"><X aria-hidden /></button>
      <h2 id="titulo-repeticion" className="text-xl font-semibold text-ink">Repetir el módulo de {titulo}</h2>
      <p className="mt-3 text-base leading-relaxed text-body">Vas a volver a jugar los <strong>8 escenarios</strong> de este módulo, en orden. No se puede repetir uno suelto: repetir todo el módulo ayuda a fijar cómo se distingue un fraude de un caso legítimo.</p>
      <p className="mt-3 text-base leading-relaxed text-body">Tu nota actual (<strong>{aprobados}/8</strong>) se mantiene mientras juegas. Solo se reemplaza cuando termines los 8. Si dejas la repetición a medias, conservas <strong>{aprobados}/8</strong>.</p>
      {aprobado && <p className="mt-3 text-base leading-relaxed text-body">Cuenta tu <strong>última</strong> ronda completa, así que tu nota puede bajar si esta vez te va peor.</p>}
      <div className="mt-6 flex gap-3"><button type="button" onClick={confirmar} className="min-h-11 flex-1 rounded-md bg-primary px-4 py-2 font-medium text-on-primary">Empezar la repetición</button><button type="button" onClick={onClose} className="min-h-11 rounded-md border border-hairline-strong px-4 py-2 text-body">Ahora no</button></div>
    </div>
  </div>
}
