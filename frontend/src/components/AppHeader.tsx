import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import InfoLink from './InfoLink'
import Brand from './Marca'
import UserMenu from './MenuUsuario'

// Barra de navegación única: fija la altura/margen del retorno y el tamaño de letra
// (text-sm) para todas las páginas, y monta ella misma ayuda + menú de cuenta porque
// cerrar sesión debe estar disponible en cualquier punto del recorrido.
// CLASE_ATRAS no lleva el verde subrayado de un enlace (DESIGN.md §2 es para texto
// corrido); es cromo de navegación, así que se viste gris como el resto del cromo.
export const BACK_CLASS =
  '-mx-2 inline-flex shrink-0 items-center rounded-md px-2 py-1.5 font-medium text-body transition hover:bg-surface-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link'

function AppHeader({
  atras: back,
  etiqueta: label,
  children,
}: {
  /** Enlace o botón de retorno. Va pegado a la marca, a la izquierda. */
  atras?: ReactNode
  /** Rótulo junto al logo, p. ej. "Supervisión" en el panel del supervisor. */
  etiqueta?: string
  /** Dato corto de ubicación, p. ej. "Phishing · 1 de 8". Una frase entera no va aquí:
   *  eso se relee bajo demanda en "Ver contexto y mis datos". */
  children?: ReactNode
}) {
  const { isSupervisor } = useAuth()

  return (
    <header className="shrink-0 border-b border-hairline bg-canvas">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-6 py-2 text-sm">
        {/* Marca, filete y retorno viajan juntos con poco aire: son un solo bloque
            ("dónde estoy y cómo salgo") que sin el filete de junta parece dos marcas. */}
        <div className="flex shrink-0 items-center gap-3">
          {/* La marca es también el camino de vuelta al panel, como en
              cualquier sitio: quien se pierde dentro de un módulo pulsa el
              logo. */}
          <Link
            to={isSupervisor ? '/admin' : '/dashboard'}
            className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link"
          >
            <Brand variante="logo" className="h-10 w-auto" />
          </Link>

          {(label || back) && <span aria-hidden className="h-6 w-px bg-hairline-strong" />}

          {label && (
            <span className="text-xs font-semibold uppercase tracking-[0.88px] text-muted">
              {label}
            </span>
          )}

          {back}
        </div>

        {/* Empuja los datos cortos y la cuenta al extremo derecho. */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-5 gap-y-1">
          {children}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {/* La bienvenida explica los tipos de engaño y qué pasa con los
              datos del participante; al supervisor no le dice nada. */}
          {!isSupervisor && <InfoLink />}
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

export default AppHeader
