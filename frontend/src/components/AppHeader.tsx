import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import InfoLink from './InfoLink'
import MenuUsuario from './MenuUsuario'

/**
 * Barra de navegación única de la app. Existe para que el enlace de retorno
 * tenga siempre la misma altura y el mismo margen izquierdo en todas las
 * pantallas: el ancho del contenido de cada página cambia, el de la barra no.
 *
 * Fija también el tamaño de letra de todo lo que vive dentro (`text-sm`) en vez
 * de dejar que cada página lo declare: así era como "← Volver" acababa siendo
 * más pequeño en una sección que dentro del escenario al que esa sección lleva.
 * Lo que cada página pasa solo dice el color, nunca la medida.
 *
 * Y monta ella misma el lado derecho —ayuda y menú de cuenta— porque cerrar
 * sesión tiene que estar disponible en cualquier punto del recorrido, también a
 * mitad de un escenario, y eso no se consigue si cada página decide si lo pone.
 */
/**
 * El control de retorno del header, para los cuatro sitios que lo tienen.
 *
 * No lleva el verde subrayado de un enlace: DESIGN.md §2 reserva ese
 * tratamiento para los enlaces dentro de texto corrido, y aquí el resultado era
 * un "← Volver" verde y subrayado pegado a un logo verde, dos voltajes de marca
 * peleando en el mismo rincón de la pantalla. Esto es cromo de navegación, así
 * que se viste como el resto del cromo —gris que se enciende al pasar por
 * encima, igual que ⓘ y el menú de cuenta del otro extremo—.
 */
export const CLASE_ATRAS =
  '-mx-2 inline-flex shrink-0 items-center rounded-md px-2 py-1.5 font-medium text-body transition hover:bg-surface-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link'

function AppHeader({
  atras,
  etiqueta,
  children,
}: {
  /** Enlace o botón de retorno. Va pegado a la marca, a la izquierda. */
  atras?: ReactNode
  /** Rótulo junto al logo, p. ej. "Supervisión" en el panel del supervisor. */
  etiqueta?: string
  /** Dato corto de ubicación, p. ej. "Phishing · 1 de 8". Va al fondo de la
   *  fila, junto a la cuenta: es del mismo tamaño que el resto del cromo de
   *  navegación, así que no pesa más que un ítem más de él. Una frase entera
   *  —el resumen de un escenario— no va aquí: eso se relee bajo demanda en
   *  "Ver contexto y mis datos", no se deja fijo compitiendo con salir,
   *  ubicación y cuenta. */
  children?: ReactNode
}) {
  const { isSupervisor } = useAuth()

  return (
    <header className="shrink-0 border-b border-hairline bg-canvas">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-6 py-2 text-sm">
        {/* Marca, filete y retorno viajan juntos y con poco aire entre ellos:
            son un solo bloque —"dónde estoy y cómo salgo"— y separados por el
            hueco general se leían como dos elementos sueltos que compiten.

            El filete es lo que hace de junta. Sin él, logo y "Volver" a la
            misma altura y sin nada en medio parecen dos marcas. */}
        <div className="flex shrink-0 items-center gap-3">
          {/* La marca es también el camino de vuelta al panel, como en
              cualquier sitio: quien se pierde dentro de un módulo pulsa el
              logo. */}
          <Link
            to={isSupervisor ? '/admin' : '/dashboard'}
            className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link"
          >
            <img
              src="/marca/logo-safeweb.webp"
              alt="SafeWeb"
              width={2171}
              height={723}
              className="h-10 w-auto"
            />
          </Link>

          {(etiqueta || atras) && <span aria-hidden className="h-6 w-px bg-hairline-strong" />}

          {etiqueta && (
            <span className="text-xs font-semibold uppercase tracking-[0.88px] text-muted">
              {etiqueta}
            </span>
          )}

          {atras}
        </div>

        {/* Empuja los datos cortos y la cuenta al extremo derecho. */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-5 gap-y-1">
          {children}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {/* La bienvenida explica los tipos de engaño y qué pasa con los
              datos del participante; al supervisor no le dice nada. */}
          {!isSupervisor && <InfoLink />}
          <MenuUsuario />
        </div>
      </div>
    </header>
  )
}

export default AppHeader
