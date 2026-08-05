import { Inbox, Send, Trash2, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  formatoFecha,
  formatoHora,
  useRelojDelSistema,
} from '../../hooks/useRelojDelSistema'
import styles from './DeviceScreen.module.css'

export interface AccionCorreo {
  Icono: LucideIcon
  /** Va escrita debajo del icono. Corta: es lo que fija el ancho del botón, y
   *  cinco de ellas tienen que caber en el ancho de la ventana. */
  etiqueta: string
  /** Nombre completo de la acción. Se lee en voz alta y sale como globo al
   *  detenerse encima, así que puede ser más explícito que la etiqueta. */
  titulo: string
  goto: string
  label: string
}

/**
 * Barra de acciones del cliente de correo: responder, reenviar, archivar,
 * eliminar, marcar como spam.
 *
 * Cada acción lleva su nombre escrito debajo del icono, no solo un globo de
 * ayuda. Un icono suelto obliga a adivinar —o a descubrir que hay globo—, y
 * este escenario mide si alguien reconoce un fraude, no si interpreta
 * pictogramas. Apiladas en columna sí caben las cinco, que en una sola línea
 * no cabían.
 *
 * Todas las acciones son reales: ninguna es decorativa. Un botón que aparenta
 * responder y no hace nada es justo la frustración que este escenario venía
 * arreglando, y además estas son las reacciones que de verdad tiene la gente
 * ante un correo sospechoso — dejarlas de adorno sería perder el dato.
 */
export function MailToolbar({ acciones }: { acciones: AccionCorreo[] }) {
  return (
    <div className={styles.mailToolbar} role="toolbar" aria-label="Acciones del correo">
      {acciones.map(({ Icono, etiqueta, titulo, goto, label }) => (
        <button
          key={goto}
          type="button"
          className={styles.mailToolbarBtn}
          title={titulo}
          // La etiqueta visible puede ir abreviada ("Spam"); el nombre que se
          // anuncia es siempre el completo.
          aria-label={titulo}
          data-hotspot-goto={goto}
          data-hotspot-label={label}
        >
          <Icono aria-hidden className={styles.mailToolbarIcon} strokeWidth={1.75} />
          <span aria-hidden className={styles.mailToolbarTexto}>
            {etiqueta}
          </span>
        </button>
      ))}
    </div>
  )
}

/** Columna de carpetas del cliente de correo. Decorativa: solo aporta el
 *  aspecto de cliente de escritorio.
 *
 *  Vive aquí y no en cada pantalla porque estaba duplicada palabra por palabra
 *  en DeviceScreen y en el escenario interactivo, y las dos copias ya habían
 *  empezado a ser lo mismo escrito dos veces.
 *
 *  Iconos de trazo en vez de emoji: 📥 y 🗑 se dibujan distinto en cada
 *  sistema operativo —a color y con estilo propio— y le daban al cliente un
 *  aire de juguete que ningún correo real tiene. */
export function MailNav() {
  return (
    <nav className={styles.mailNav} aria-hidden>
      <span className={`${styles.mailNavItem} ${styles.mailNavActive}`}>
        <Inbox className={styles.mailNavIcon} strokeWidth={1.75} />
        Recibidos
      </span>
      <span className={styles.mailNavItem}>
        <Send className={styles.mailNavIcon} strokeWidth={1.75} />
        Enviados
      </span>
      <span className={styles.mailNavItem}>
        <Trash2 className={styles.mailNavIcon} strokeWidth={1.75} />
        Papelera
      </span>
    </nav>
  )
}

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
 *  representa "salir de aquí y entrar por mi cuenta al sitio real".
 *
 *  Tiene las tres partes que hacen que una franja se lea como barra de tareas y
 *  no como un pie de página: menú de inicio, apps ancladas y bandeja con reloj.
 *  Sin ellas, el atajo quedaba como una etiqueta suelta sobre una franja oscura
 *  y nadie lo tomaba por algo que se puede usar. */
export function Taskbar({
  atajo,
  reloj = { hora: '10:41', fecha: '4/8/2026' },
}: {
  atajo?: { texto: string; goto: string; label: string }
  /** La hora del sistema.
   *
   *  `'vivo'` toma la hora real del equipo y la deja avanzar, que es lo que
   *  hace que la ventana se lea como el computador de quien está jugando. Solo
   *  sirve si el escenario también sitúa su mensaje en relación al ahora: un
   *  reloj real junto a un correo fechado a una hora fija vuelve a dejar dos
   *  relojes que se contradicen, que es el problema que esto viene a resolver.
   *
   *  Un par fijo sigue valiendo para los escenarios cuya historia depende de
   *  una hora concreta ("son casi las diez de la noche"). */
  reloj?: { hora: string; fecha: string } | 'vivo'
}) {
  const ahora = useRelojDelSistema()
  const { hora, fecha } =
    reloj === 'vivo' ? { hora: formatoHora(ahora), fecha: formatoFecha(ahora) } : reloj

  return (
    <div className={styles.taskbar}>
      <span className={styles.taskbarStart} aria-hidden>
        ⊞
      </span>
      <span className={styles.taskbarDivider} aria-hidden />

      {atajo && (
        <button
          type="button"
          className={styles.taskbarAtajo}
          // Se lee en voz alta y aparece como globo del sistema al detenerse
          // encima: dos formas más de enterarse de que el atajo se puede usar,
          // sin añadir nada visible en reposo.
          title={`Abrir ${atajo.texto.replace(/^[^\p{L}\d]+/u, '')}`}
          data-hotspot-goto={atajo.goto}
          data-hotspot-label={atajo.label}
        >
          {atajo.texto}
        </button>
      )}

      <span className={styles.taskbarTray} aria-hidden>
        <span>📶</span>
        <span>🔊</span>
        <span className={styles.taskbarClock}>
          <span>{hora}</span>
          <span>{fecha}</span>
        </span>
      </span>
    </div>
  )
}

/** Contenedor genérico de una ventana de escritorio: título + cuerpo + tareas.
 *  Cada escenario decide qué va en `children`. */
export function VentanaEscritorio({
  titulo,
  atajo,
  reloj,
  onClick,
  ariaLabel,
  children,
}: {
  titulo: string
  atajo?: { texto: string; goto: string; label: string }
  reloj?: { hora: string; fecha: string } | 'vivo'
  onClick?: (event: React.MouseEvent) => void
  ariaLabel: string
  children: ReactNode
}) {
  return (
    <section className={`${styles.screen} ${styles.desktop}`} aria-label={ariaLabel} onClick={onClick}>
      <Titlebar texto={titulo} />
      {children}
      <Taskbar atajo={atajo} reloj={reloj} />
    </section>
  )
}
