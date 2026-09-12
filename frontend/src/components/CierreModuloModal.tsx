import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import ModuleCompletion from './CierreModulo'
import type { Scenario, Section } from '../data/catalogo'
import type { Progress } from '../lib/api'

interface ModuleCompletionModalProps {
  seccion: Section
  escenarios: Scenario[]
  progreso: Progress
  onClose: () => void
}

// Diálogo, no bloque fijo: se abre por elección de quien ya aprobó. Sin biblioteca de
// modales (un <div role="dialog"> alcanza). El fondo que cierra es un <button> real, no
// un <div onClick>, porque un <button> no admite el <div> del panel como hijo — va detrás.
function ModuleCompletionModal({ seccion: section, escenarios: scenarios, progreso: progress, onClose }: ModuleCompletionModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-10 sm:items-center">
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar resumen del módulo"
        className="fixed inset-0 cursor-default appearance-none border-0 bg-scrim p-0"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-cierre"
        className="relative z-10 w-full max-w-2xl rounded-lg bg-canvas shadow-card"
      >
        <div className="flex justify-end p-2">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar resumen del módulo"
            className="inline-flex size-9 items-center justify-center rounded-md text-muted transition hover:bg-surface-strong hover:text-ink"
          >
            <X aria-hidden className="size-[18px]" strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-5 pb-5">
          <ModuleCompletion seccion={section} escenarios={scenarios} progreso={progress} />
        </div>
      </div>
    </div>
  )
}

export default ModuleCompletionModal
