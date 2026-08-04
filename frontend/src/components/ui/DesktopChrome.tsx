import type { ReactNode } from 'react'
import styles from './DeviceScreen.module.css'

/** Barra de título de ventana de escritorio: el nombre de la app o pestaña
 *  activa. Sin botones de ventana a propósito: unos puntos de colores se leen
 *  como macOS y una franja ─ □ ✕ se lee como Windows; sin ninguno de los dos,
 *  el marco sigue leyéndose como "una ventana" para cualquiera, sea cual sea
 *  el sistema que use. */
export function Titlebar({ texto }: { texto: string }) {
  return (
    <div className={styles.titlebar}>
      <span className={styles.titlebarText}>{texto}</span>
    </div>
  )
}

/** Franja de tareas al pie de la ventana: la señal más reconocible de "esto es
 *  un computador", ausente en cualquier app de celular. Puramente decorativa
 *  salvo que se le dé un atajo: en ese caso es un punto interactivo más, y
 *  representa "salir de aquí y entrar por mi cuenta al sitio real". */
export function Taskbar({ atajo }: { atajo?: { texto: string; goto: string; label: string } }) {
  return (
    <div className={styles.taskbar}>
      <span className={styles.taskbarStart} aria-hidden>
        ▦
      </span>
      {atajo && (
        <button
          type="button"
          className={styles.taskbarAtajo}
          data-hotspot-goto={atajo.goto}
          data-hotspot-label={atajo.label}
        >
          {atajo.texto}
        </button>
      )}
      <span className={styles.taskbarClock} aria-hidden={!atajo}>
        10:41
      </span>
    </div>
  )
}

/** Contenedor genérico de una ventana de escritorio: título + cuerpo + tareas.
 *  Cada escenario decide qué va en `children`. */
export function VentanaEscritorio({
  titulo,
  atajo,
  onClick,
  ariaLabel,
  children,
}: {
  titulo: string
  atajo?: { texto: string; goto: string; label: string }
  onClick?: (event: React.MouseEvent) => void
  ariaLabel: string
  children: ReactNode
}) {
  return (
    <section className={`${styles.screen} ${styles.desktop}`} aria-label={ariaLabel} onClick={onClick}>
      <Titlebar texto={titulo} />
      {children}
      <Taskbar atajo={atajo} />
    </section>
  )
}
