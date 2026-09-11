import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type Preferencia } from '../context/ThemeContext'

const OPCIONES: { valor: Preferencia; etiqueta: string; Icono: typeof Sun }[] = [
  { valor: 'sistema', etiqueta: 'Sistema', Icono: Monitor },
  { valor: 'claro', etiqueta: 'Claro', Icono: Sun },
  { valor: 'oscuro', etiqueta: 'Oscuro', Icono: Moon },
]

/**
 * Tres opciones de tema en un solo control, con texto además del ícono
 * (SC 1.4.1: el color no puede ser la única señal, y un público no técnico
 * no siempre reconoce un ícono de sol/luna sin la palabra).
 *
 * Vive en dos sitios: dentro de MenuUsuario, para quien ya inició sesión, y
 * en AuthLayout, para Login y Registro, que son públicas y no montan
 * MenuUsuario. Verificar y PoliticaDatos heredan la preferencia guardada sin
 * llevar control propio: son páginas de paso.
 */
function SelectorTema() {
  const { preferencia, setPreferencia } = useTheme()

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
