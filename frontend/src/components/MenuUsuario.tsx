import { ChevronDown, LogOut, Route } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'

/**
 * Identidad y sesión, en un solo control del header.
 *
 * Antes el lado derecho era una fila de cuatro cosas sueltas —nombre, "Tu
 * recorrido", ⓘ y "Salir"— con cuatro pesos visuales distintos compitiendo
 * entre sí, y aun así "Salir" solo existía en el panel y en el admin: a mitad
 * de un escenario no había forma de cerrar sesión.
 *
 * Se agrupa lo que es "tu cuenta" detrás del avatar, que es donde la gente ya
 * lo busca, y se deja fuera únicamente la ayuda, que es contextual. El nombre
 * sigue visible en escritorio: identifica la sesión de un vistazo, que es lo
 * que importa en un equipo compartido.
 */
function MenuUsuario() {
  const { displayName, initials, roleLabel, isSupervisor, logout } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const botonRef = useRef<HTMLButtonElement>(null)

  const nombre = displayName || (isSupervisor ? 'Supervisor' : 'Participante')
  const iniciales = initials || nombre.slice(0, 1).toUpperCase()

  const claseItem =
    'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-ink transition hover:bg-canvas-soft focus-visible:bg-canvas-soft focus-visible:outline-none'

  return (
    // El foco que sale del grupo cierra el menú: cubre a la vez el clic fuera y
    // el tabulador, sin escuchar en `document`.
    <div
      className="relative"
      onBlur={(evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget)) setAbierto(false)
      }}
      onKeyDown={(evento) => {
        if (evento.key === 'Escape' && abierto) {
          setAbierto(false)
          botonRef.current?.focus()
        }
      }}
    >
      <button
        ref={botonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((previo) => !previo)}
        className="flex h-9 items-center gap-2 rounded-md border border-transparent pl-1 pr-1.5 text-sm font-medium text-ink transition hover:bg-surface-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link sm:pr-2"
      >
        <span
          aria-hidden
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-mint-light text-xs font-semibold text-primary"
        >
          {iniciales}
        </span>
        <span className="hidden max-w-32 truncate sm:inline">{nombre}</span>
        <ChevronDown aria-hidden className="size-4 text-muted" strokeWidth={2} />
      </button>

      {abierto && (
        <div
          role="menu"
          aria-label="Tu cuenta"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-hairline-strong bg-surface py-1 shadow-card"
        >
          <div className="border-b border-hairline px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-ink">{nombre}</p>
            <p className="text-xs text-muted">{isSupervisor ? 'Supervisor' : roleLabel}</p>
          </div>

          {!isSupervisor && (
            <Link
              role="menuitem"
              to="/recorrido"
              onClick={() => setAbierto(false)}
              className={claseItem}
            >
              <Route aria-hidden className="size-4 text-muted" strokeWidth={1.75} />
              Tu recorrido
            </Link>
          )}

          <button role="menuitem" type="button" onClick={logout} className={claseItem}>
            <LogOut aria-hidden className="size-4 text-muted" strokeWidth={1.75} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

export default MenuUsuario
