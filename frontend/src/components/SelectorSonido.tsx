import { Volume2, VolumeX } from 'lucide-react'
import { useSound } from '../context/SoundContext'

/** Interruptor único (no radiogroup como el de tema: solo hay dos estados),
 *  para dentro de un menú (MenuUsuario). role="switch" en vez de checkbox: es
 *  un cambio inmediato ("prender/apagar"), no una casilla que se confirma con
 *  otra acción. */
function SoundSelector() {
  const { activado: enabled, setActivado: setEnabled } = useSound()
  const Icon = enabled ? Volume2 : VolumeX

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => setEnabled(!enabled)}
      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-ink transition hover:bg-canvas-soft focus-visible:bg-canvas-soft focus-visible:outline-none"
    >
      <Icon aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
      <span className="flex-1">Sonido</span>
      {/* aria-hidden: el estado ya lo dice aria-checked en el propio botón; sin
          esto un lector de pantalla anunciaría "Sonido Activado interruptor
          activado", el mismo dato dos veces. */}
      <span aria-hidden className="text-xs font-normal text-muted">
        {enabled ? 'Activado' : 'Desactivado'}
      </span>
    </button>
  )
}

export default SoundSelector
