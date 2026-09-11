import type { ReactNode } from 'react'
import styles from './DeviceScreen.module.css'

// Ningún elemento llama a engine.choose por su cuenta: solo llevan
// data-hotspot-*, y manejarClicHotspot, delegado en el contenedor, decide qué
// hacer. Ver docs/superpowers/specs/2026-08-04-escenario-interactivo-factura-sri-design.md.

interface HotspotBaseProps {
  goto: string
  label: string
  signalId?: string
  className?: string
  style?: React.CSSProperties
  ariaLabel?: string
  children: ReactNode
}

// href real: es la única "revelación" de URL que existe (la nativa del
// navegador al pasar el mouse). preventDefault corta la navegación pero no
// la propagación, así que el clic igual llega al manejador delegado.
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

export function BotonHotspot({ goto, label, signalId, className, style, ariaLabel, children }: Readonly<HotspotBaseProps>) {
  return (
    <button
      type="button"
      data-hotspot-goto={goto}
      data-hotspot-label={label}
      data-signal={signalId}
      className={`${styles.hotspot} ${className ?? ''}`}
      style={style}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}

// Los cuerpos de correo se inyectan como HTML sin manejador propio, así que
// esto corta cualquier <a> real para no sacar al participante del entrenamiento.
export function evitarNavegacion(event: React.MouseEvent) {
  if ((event.target as HTMLElement).closest('a')) {
    event.preventDefault()
  }
}

// Devuelve false cuando el clic no cayó en ningún hotspot, para que la
// pantalla distinga "aquí no hay nada" de "la simulación se colgó".
export function manejarClicHotspot(
  event: React.MouseEvent,
  onHotspot: (goto: string, label?: string) => void,
): boolean {
  evitarNavegacion(event)

  const objetivo = (event.target as HTMLElement).closest<HTMLElement>('[data-hotspot-goto]')
  if (!objetivo) {
    return false
  }

  onHotspot(objetivo.dataset.hotspotGoto ?? '', objetivo.dataset.hotspotLabel)
  return true
}
