import { ChevronDown, LogOut, Route } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import ThemeSelector from './SelectorTema'

// Agrupa cuenta/sesión detrás del avatar; antes "Salir" solo existía en
// panel y admin, sin forma de cerrar sesión a mitad de un escenario.
function UserMenu() {
  const { displayName, initials: accountInitials, roleLabel, isSupervisor, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const name = displayName || (isSupervisor ? 'Supervisor' : 'Participante')
  const initials = accountInitials || name.slice(0, 1).toUpperCase()

  const itemClassName =
    'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-ink transition hover:bg-canvas-soft focus-visible:bg-canvas-soft focus-visible:outline-none'

  return (
    // onBlur cubre clic-fuera y tabulador sin escuchar en document.
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false)
          buttonRef.current?.focus()
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className="flex h-9 items-center gap-2 rounded-md border border-transparent pl-1 pr-1.5 text-sm font-medium text-ink transition hover:bg-surface-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link sm:pr-2"
      >
        <span
          aria-hidden
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-mint-light text-xs font-semibold text-primary"
        >
          {initials}
        </span>
        <span className="hidden max-w-32 truncate sm:inline">{name}</span>
        <ChevronDown aria-hidden className="size-4 text-muted" strokeWidth={2} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Tu cuenta"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-hairline-strong bg-surface py-1 shadow-card"
        >
          <div className="border-b border-hairline px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="text-xs text-muted">{isSupervisor ? 'Supervisor' : roleLabel}</p>
          </div>

          <div className="border-b border-hairline py-1.5">
            <p className="px-3 pb-1 text-xs font-medium text-muted">Tema</p>
            <ThemeSelector variante="lista" />
          </div>

          {!isSupervisor && (
            <Link
              role="menuitem"
              to="/recorrido"
              onClick={() => setOpen(false)}
              className={itemClassName}
            >
              <Route aria-hidden className="size-4 text-muted" strokeWidth={1.75} />
              Tu recorrido
            </Link>
          )}

          {/* Borde arriba: separa la salida del resto de opciones, no es una
              más de la lista. */}
          <div className="mt-1 border-t border-hairline pt-1">
            <button role="menuitem" type="button" onClick={logout} className={itemClassName}>
              <LogOut aria-hidden className="size-4 text-muted" strokeWidth={1.75} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserMenu
