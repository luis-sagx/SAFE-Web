import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import CierreModulo from './CierreModulo'
import type { Escenario, Seccion as SeccionCatalogo } from '../data/catalogo'
import type { Progreso } from '../lib/api'

interface CierreModuloModalProps {
  seccion: SeccionCatalogo
  escenarios: Escenario[]
  progreso: Progreso
  onClose: () => void
}

/**
 * El resumen del módulo (`CierreModulo`), como diálogo y no como bloque fijo
 * de la página: se abre por elección de quien ya aprobó, no en cada visita a
 * la sección. Sin biblioteca de modales — es un único caso de uso y un
 * `<div>` con `role="dialog"` resuelve lo que hace falta: foco al abrir,
 * Escape para cerrar, clic fuera para cerrar.
 *
 * El fondo que cierra al hacer clic es un `<button>` de verdad, no un `<div>`
 * con `onClick`: un elemento sin semántica interactiva y con manejador de
 * clic no se puede operar con teclado, y por eso no puede ir como padre del
 * panel del diálogo (un `<button>` solo admite contenido de fraseo, no los
 * `<div>` del panel) — va detrás, del mismo tamaño que la pantalla, y el
 * panel se dibuja encima con `z-10`. Así el panel no necesita su propio
 * `onClick` para frenar la propagación.
 */
function CierreModuloModal({ seccion, escenarios, progreso, onClose }: CierreModuloModalProps) {
  const cerrarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cerrarRef.current?.focus()

    function onKeyDown(evento: KeyboardEvent) {
      if (evento.key === 'Escape') onClose()
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
        className="fixed inset-0 cursor-default appearance-none border-0 bg-ink/40 p-0"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-cierre"
        className="relative z-10 w-full max-w-2xl rounded-lg bg-canvas shadow-card"
      >
        <div className="flex justify-end p-2">
          <button
            ref={cerrarRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar resumen del módulo"
            className="inline-flex size-9 items-center justify-center rounded-md text-muted transition hover:bg-surface-strong hover:text-ink"
          >
            <X aria-hidden className="size-[18px]" strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-5 pb-5">
          <CierreModulo seccion={seccion} escenarios={escenarios} progreso={progreso} />
        </div>
      </div>
    </div>
  )
}

export default CierreModuloModal
