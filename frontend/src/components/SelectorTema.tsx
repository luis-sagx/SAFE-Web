import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type Preference } from '../context/ThemeContext'

const OPTIONS: { valor: Preference; etiqueta: string; Icono: typeof Sun }[] = [
  { valor: 'sistema', etiqueta: 'Sistema', Icono: Monitor },
  { valor: 'claro', etiqueta: 'Claro', Icono: Sun },
  { valor: 'oscuro', etiqueta: 'Oscuro', Icono: Moon },
]

interface ThemeSelectorProps {
  /** 'segmentado': tres botones en fila, para un encabezado con espacio de
   *  sobra (AuthLayout). 'lista': tres filas apiladas de ancho completo, para
   *  dentro de un menú angosto (MenuUsuario) — ahí "Sistema"/"Claro"/"Oscuro"
   *  los tres a la vez en fila no entraban en el ancho del menú y el tercero
   *  quedaba cortado, sin scroll posible dentro de un `role="menu"`. */
  variante?: 'segmentado' | 'lista'
}

// Texto además de ícono por SC 1.4.1: el color no puede ser la única señal.
function ThemeSelector({ variante: variant = 'segmentado' }: ThemeSelectorProps) {
  const { preferencia: preference, setPreferencia: setPreference } = useTheme()

  if (variant === 'lista') {
    return (
      <div role="radiogroup" aria-label="Tema de la interfaz" className="flex flex-col">
        {OPTIONS.map(({ valor: value, etiqueta: label, Icono: Icon }) => {
          const active = preference === value
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setPreference(value)}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-ink transition hover:bg-canvas-soft focus-visible:bg-canvas-soft focus-visible:outline-none"
            >
              <Icon aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
              <span className="flex-1">{label}</span>
              {active && <Check aria-hidden className="size-4 shrink-0 text-primary" strokeWidth={2} />}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div role="radiogroup" aria-label="Tema de la interfaz" className="inline-flex gap-0.5 rounded-md bg-surface-strong p-0.5">
      {OPTIONS.map(({ valor: value, etiqueta: label, Icono: Icon }) => {
        const active = preference === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPreference(value)}
            className={`flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-sm px-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ${
              active ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'
            }`}
          >
            <Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
            <span className="sr-only sm:not-sr-only">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default ThemeSelector
