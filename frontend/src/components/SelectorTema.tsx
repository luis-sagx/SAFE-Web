import { Check } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { THEME_OPTIONS } from '../data/opcionesTema'

/** Tres filas apiladas de ancho completo, para dentro de un menú (MenuTema,
 *  MenuUsuario). Antes había también una variante en fila siempre visible;
 *  se retiró porque las tres opciones a la vista competían con la marca para
 *  algo que casi nadie cambia más de una vez. */
// Texto además de ícono por SC 1.4.1: el color no puede ser la única señal.
function ThemeSelector() {
  const { preferencia: preference, setPreferencia: setPreference } = useTheme()

  return (
    <div role="radiogroup" aria-label="Tema de la interfaz" className="flex flex-col">
      {THEME_OPTIONS.map(({ valor: value, etiqueta: label, Icono: Icon }) => {
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

export default ThemeSelector
