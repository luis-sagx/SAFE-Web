import type { ReactNode } from 'react'
import styles from './DeviceScreen.module.css'

/**
 * Primitivas para escenarios donde el participante actúa directamente sobre
 * la pantalla simulada en vez de elegir de una lista de acciones descritas.
 * Ver docs/superpowers/specs/2026-08-04-escenario-interactivo-factura-sri-design.md.
 *
 * Ningún elemento llama a `engine.choose` por su cuenta: solo llevan los
 * `data-hotspot-*`, y un único manejador delegado en el contenedor de la
 * pantalla —`manejarClicHotspot`— decide qué hacer. Así el escenario no tiene
 * que pasar la función de decisión a cada botón por separado.
 */

interface HotspotBaseProps {
  /** Nodo al que salta el grafo si se toca este punto. */
  goto: string
  /** Se guarda en la traza de la corrida junto con `goto`. */
  label: string
  /** Si además es una señal del debrief, el id que el recorrido va a buscar
   *  con `[data-signal="…"]` para resaltarlo. */
  signalId?: string
  className?: string
  children: ReactNode
}

/** Enlace real: el `href` es el destino falso o verdadero que se quiere que
 *  el navegador muestre al pasar el mouse — es la única "revelación" de URL
 *  que existe, la nativa del navegador, sin tooltip propio. Nunca navega de
 *  verdad: `preventDefault` corta la navegación, pero no la propagación, así
 *  que el clic igual llega al manejador delegado del contenedor. */
export function EnlaceHotspot({
  goto,
  label,
  href,
  signalId,
  className,
  children,
}: HotspotBaseProps & { href: string }) {
  return (
    <a
      href={href}
      onClick={(event) => event.preventDefault()}
      data-hotspot-goto={goto}
      data-hotspot-label={label}
      data-signal={signalId}
      className={className}
    >
      {children}
    </a>
  )
}

/** Cualquier otro punto interactivo que no sea un enlace: el adjunto, el
 *  botón de enviar un formulario, un atajo del escritorio. */
export function BotonHotspot({ goto, label, signalId, className, children }: HotspotBaseProps) {
  return (
    <button
      type="button"
      data-hotspot-goto={goto}
      data-hotspot-label={label}
      data-signal={signalId}
      className={`${styles.hotspot} ${className ?? ''}`}
    >
      {children}
    </button>
  )
}

/** Manejador único para el contenedor de la pantalla: busca el punto
 *  interactivo más cercano al elemento clicado y dispara la elección. Un solo
 *  `onClick` en la raíz reemplaza un `onClick` por botón. */
export function manejarClicHotspot(
  event: React.MouseEvent,
  onHotspot: (goto: string, label?: string) => void,
) {
  const objetivo = (event.target as HTMLElement).closest<HTMLElement>('[data-hotspot-goto]')
  if (!objetivo) {
    return
  }

  onHotspot(objetivo.dataset.hotspotGoto ?? '', objetivo.dataset.hotspotLabel)
}
