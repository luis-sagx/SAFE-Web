import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type Preferencia } from '../context/ThemeContext'

const OPCIONES: { valor: Preferencia; etiqueta: string; Icono: typeof Sun }[] = [
  { valor: 'sistema', etiqueta: 'Sistema', Icono: Monitor },
  { valor: 'claro', etiqueta: 'Claro', Icono: Sun },
  { valor: 'oscuro', etiqueta: 'Oscuro', Icono: Moon },
]

interface SelectorTemaProps {
  /** 'segmentado': tres botones en fila, para un encabezado con espacio de
   *  sobra (AuthLayout). 'lista': tres filas apiladas de ancho completo, para
   *  dentro de un menú angosto (MenuUsuario) — ahí "Sistema"/"Claro"/"Oscuro"
   *  los tres a la vez en fila no entraban en el ancho del menú y el tercero
   *  quedaba cortado, sin scroll posible dentro de un `role="menu"`. */
  variante?: 'segmentado' | 'lista'
}

// Texto además de ícono por SC 1.4.1: el color no puede ser la única señal.
function SelectorTema({ variante = 'segmentado' }: SelectorTemaProps) {
  const { preferencia, setPreferencia } = useTheme()

  if (variante === 'lista') {
    return (
      <div role="radiogroup" aria-label="Tema de la interfaz" className="flex flex-col">
        {OPCIONES.map(({ valor, etiqueta, Icono }) => {
          const activo = preferencia === valor
          return (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => setPreferencia(valor)}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-ink transition hover:bg-canvas-soft focus-visible:bg-canvas-soft focus-visible:outline-none"
            >
              <Icono aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
              <span className="flex-1">{etiqueta}</span>
              {activo && <Check aria-hidden className="size-4 shrink-0 text-primary" strokeWidth={2} />}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div role="radiogroup" aria-label="Tema de la interfaz" className="inline-flex gap-0.5 rounded-md bg-surface-strong p-0.5">
      {OPCIONES.map(({ valor, etiqueta, Icono }) => {
        const activo = preferencia === valor
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => setPreferencia(valor)}
            className={`flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-sm px-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ${
              activo ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'
            }`}
          >
            <Icono aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
            <span className="sr-only sm:not-sr-only">{etiqueta}</span>
          </button>
        )
      })}
    </div>
  )
}

export default SelectorTema
