import { Inbox, Send, Trash2, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  formatoFecha,
  formatoHora,
  useRelojDelSistema,
} from '../../hooks/useRelojDelSistema'
import { useAuth } from '../../context/AuthContext'
import styles from './DeviceScreen.module.css'

/** Acceso directo anclado en la barra de tareas. */
export interface AtajoTaskbar {
  texto: string
  goto: string
  label: string
}

/** Hora del sistema: un par fijo, o `'vivo'` para la real del equipo. */
export type Reloj = { hora: string; fecha: string } | 'vivo'

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
  atajo?: AtajoTaskbar
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
  reloj?: Reloj
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
  atajo?: AtajoTaskbar
  reloj?: Reloj
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

/** Remitente tal y como lo pinta la cabecera del mensaje. */
export interface RemitenteCorreo {
  nombre: string
  direccion: string
  /** Etiqueta que pone el propio cliente: "Externo", "Promociones"… */
  etiqueta?: string
  /** `data-signal` para que el repaso pueda resaltar la dirección. */
  senalDireccion?: string
  senalEtiqueta?: string
}

interface VentanaCorreoProps {
  asunto: string
  remitente: RemitenteCorreo
  /** Fecha u hora de llegada, ya formateada por el escenario. */
  recibido: string
  /** Barra de acciones. Sin ella no se pinta: un cliente sin barra se ve
   *  incompleto, pero una barra que no responde se ve rota, y eso es peor. */
  acciones?: AccionCorreo[]
  atajo?: AtajoTaskbar
  reloj?: Reloj
  /** Manejador delegado de puntos interactivos, si el escenario los usa. */
  onClick?: (event: React.MouseEvent) => void
  /** El adjunto entero, para que cada escenario decida si es pulsable. */
  adjunto?: ReactNode
  /** Pie institucional del mensaje. */
  pie?: ReactNode
  /** Cuerpo del correo. */
  children: ReactNode
}

/**
 * La ventana de correo, completa y una sola vez.
 *
 * Estaba escrita dos veces —en DeviceScreen para los escenarios que eligen de
 * una lista, y a mano en el escenario interactivo— y las dos copias ya habían
 * divergido: la barra de acciones, el pie y el adjunto con miniatura solo
 * existían en una. Cada mejora del cliente había que hacerla dos veces o se
 * quedaba a medias.
 *
 * Aquí vive todo lo que es *el cliente de correo*: la ventana, las carpetas, la
 * barra de acciones, la cabecera del remitente, la zona de adjuntos y la franja
 * de tareas. Lo que cambia de un escenario a otro —quién escribe, qué dice, qué
 * trae adjunto— entra por props, y el cuerpo por `children`, que admite tanto
 * HTML fijo como puntos interactivos de verdad.
 */
export function VentanaCorreo({
  asunto,
  remitente,
  recibido,
  acciones,
  atajo,
  reloj,
  onClick,
  adjunto,
  pie,
  children,
}: VentanaCorreoProps) {
  const { correoSimulado } = useAuth()

  return (
    <section
      className={`${styles.screen} ${styles.desktop}`}
      aria-label="Bandeja de correo"
      onClick={onClick}
    >
      <Titlebar texto="Correo (Recibidos)" />

      <div className={styles.desktopBody}>
        <MailNav />

        <div className={styles.mailPane}>
          {acciones && <MailToolbar acciones={acciones} />}

          <div className={styles.mailbody}>
            <h1 className={styles.subject}>{asunto}</h1>

            <div className={styles.senderRow}>
              <div className={styles.avatar} aria-hidden>
                {remitente.nombre.slice(0, 1).toUpperCase()}
              </div>
              <div className={styles.senderId}>
                <p className={styles.senderName}>
                  {remitente.nombre}
                  {remitente.etiqueta && (
                    <span className={styles.label} data-signal={remitente.senalEtiqueta}>
                      {remitente.etiqueta}
                    </span>
                  )}
                </p>
                <p className={styles.senderAddr} data-signal={remitente.senalDireccion}>
                  {remitente.direccion}
                </p>
                <p className={styles.senderTo}>para {correoSimulado}</p>
              </div>
              <span className={styles.date}>{recibido}</span>
            </div>

            <div className={styles.prose}>{children}</div>

            {adjunto && (
              <div className={styles.attachmentZone}>
                <p className={styles.attachmentCount}>1 archivo adjunto</p>
                {adjunto}
              </div>
            )}

            {pie && <div className={styles.mailFooter}>{pie}</div>}
          </div>
        </div>
      </div>

      <Taskbar atajo={atajo} reloj={reloj} />
    </section>
  )
}
