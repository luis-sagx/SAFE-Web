import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { THEME_OPTIONS } from '../data/opcionesTema'
import ThemeSelector from './SelectorTema'

interface ThemeMenuProps {
  /** 'arriba' cuando el botón queda al pie de su contenedor (AuthLayout): el
   *  boleto recorta lo que se sale por abajo. */
  abre?: 'abajo' | 'arriba'
}

/// Un solo botón "Tema" que despliega las tres opciones, igual que dentro del
/// menú de cuenta: con y sin sesión el tema se cambia de la misma forma.
/// Cierre con Escape, al tocar fuera o al mover el foco fuera. Los listeners
/// van en document y no en el div contenedor: un div con onKeyDown/onClick
/// es un elemento interactivo no nativo (Sonar S6848/S1082).
function ThemeMenu({ abre: direction = 'abajo' }: Readonly<ThemeMenuProps>) {
  const { preferencia: preference } = useTheme()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  const current = THEME_OPTIONS.find((option) => option.valor === preference) ?? THEME_OPTIONS[0]!
  const CurrentIcon = current.Icono

  function close() {
    setOpen(false)
    buttonRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    function onOutside(event: Event) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onOutside)
    document.addEventListener('focusin', onOutside)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onOutside)
      document.removeEventListener('focusin', onOutside)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((previous) => !previous)}
        className="flex h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-ink transition hover:bg-surface-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
      >
        <CurrentIcon aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
        Tema
        <span className="sr-only">: {current.etiqueta}</span>
        <ChevronDown
          aria-hidden
          className={`size-4 text-muted transition ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div
          id={panelId}
          className={`absolute z-50 w-44 overflow-hidden rounded-lg border border-hairline-strong bg-surface py-1 shadow-card ${
            direction === 'arriba' ? 'bottom-full left-0 mb-2' : 'right-0 top-full mt-2'
          }`}
        >
          {/* Elegir cierra el panel: el cambio ya se ve en toda la pantalla. */}
          <ThemeSelector onSelect={close} />
        </div>
      )}
    </div>
  )
}

export default ThemeMenu
