import { ArrowLeft, ChevronDown, ChevronRight, House, LogOut, Route } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { THEME_OPTIONS } from '../data/opcionesTema'
import SoundSelector from './SelectorSonido'
import ThemeSelector from './SelectorTema'

// Agrupa cuenta/sesión detrás del avatar; antes "Salir" solo existía en
// panel y admin, sin forma de cerrar sesión a mitad de un escenario.
function UserMenu() {
  const { displayName, initials: accountInitials, roleLabel, isAdmin, logout } = useAuth()
  const { preferencia: preference } = useTheme()
  const [open, setOpen] = useState(false)
  const [showThemes, setShowThemes] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const appearanceRef = useRef<HTMLButtonElement>(null)
  const backRef = useRef<HTMLButtonElement>(null)

  const name = displayName || (isAdmin ? 'Administrador' : 'Participante')
  const initials = accountInitials || name.slice(0, 1).toUpperCase()
  const currentTheme = THEME_OPTIONS.find((option) => option.valor === preference) ?? THEME_OPTIONS[0]!
  const CurrentThemeIcon = currentTheme.Icono

  function closeMenu() {
    setOpen(false)
    setShowThemes(false)
  }

  function returnToMain() {
    setShowThemes(false)
    queueMicrotask(() => appearanceRef.current?.focus())
  }

  function openThemes() {
    setShowThemes(true)
    queueMicrotask(() => backRef.current?.focus())
  }

  const itemClassName =
    'flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left text-base font-medium text-ink transition hover:bg-canvas-soft focus-visible:bg-canvas-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-link'

  return (
    // onBlur cubre clic-fuera y tabulador sin escuchar en document.
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) closeMenu()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          closeMenu()
          buttonRef.current?.focus()
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          if (open) closeMenu()
          else setOpen(true)
        }}
        className="flex h-11 items-center gap-2 rounded-md border border-transparent pl-1 pr-1.5 text-sm font-medium text-ink transition hover:bg-surface-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link sm:pr-2"
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
          className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-lg border border-hairline-strong bg-surface py-1 shadow-card"
        >
          {showThemes ? (
            <>
              <button ref={backRef} role="menuitem" type="button" onClick={returnToMain} className={itemClassName}>
                <ArrowLeft aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
                Volver
              </button>
              <p className="border-t border-hairline px-4 pt-3 pb-1 text-sm font-semibold text-ink">
                Apariencia
              </p>
              <ThemeSelector onSelect={returnToMain} />
            </>
          ) : (
            <>
              <div className="border-b border-hairline px-4 py-3">
                <p className="truncate text-base font-semibold text-ink">{name}</p>
                <p className="text-sm text-muted">{isAdmin ? 'Administrador' : roleLabel}</p>
              </div>

              <div className="py-1">
                <Link role="menuitem" to="/" onClick={closeMenu} className={itemClassName}>
                  <House aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
                  Inicio
                </Link>
                {!isAdmin && (
                  <Link role="menuitem" to="/recorrido" onClick={closeMenu} className={itemClassName}>
                    <Route aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
                    Tu recorrido
                  </Link>
                )}
              </div>

              <div className="border-t border-hairline py-1">
                <button
                  ref={appearanceRef}
                  role="menuitem"
                  type="button"
                  aria-label={`Apariencia: ${currentTheme.etiqueta}`}
                  onClick={openThemes}
                  className={itemClassName}
                >
                  <CurrentThemeIcon aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
                  <span className="flex-1">Apariencia</span>
                  <span className="text-sm font-normal text-muted">{currentTheme.etiqueta}</span>
                  <ChevronRight aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
                </button>
                <SoundSelector />
              </div>

              <div className="border-t border-hairline py-1">
                <button role="menuitem" type="button" onClick={logout} className={itemClassName}>
                  <LogOut aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default UserMenu
