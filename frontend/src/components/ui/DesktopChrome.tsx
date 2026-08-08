import {
  ArrowLeft,
  Inbox,
  Minus,
  Square,
  X,
  LayoutGrid,
  Send,
  ShieldAlert,
  Trash2,
  Volume2,
  Wifi,
  type LucideIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { OTROS_CORREOS } from './bandeja'
import { formatoFecha, formatoHora, useRelojDelSistema } from '../../hooks/useRelojDelSistema'
import { useAuth } from '../../context/AuthContext'
import styles from './DeviceScreen.module.css'

/** Acceso directo anclado en la barra de tareas. */
export interface AtajoTaskbar {
  texto: string
  goto: string
  label: string
}

/** Hora del sistema: una fija, o `'vivo'` para la real del equipo.
 *
 *  Solo la hora. La fecha del reloj es siempre la de hoy, sin excepción: los
 *  correos llegan fechados "hoy 20:20", así que una fecha inventada en la barra
 *  de tareas contradecía al mensaje que hay que juzgar — y de paso delataba la
 *  simulación a quien mirase el reloj. */
export type Reloj = { hora: string } | 'vivo'

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

export interface CarpetaCorreo {
  nombre: string
  vacia: string
  /** Reemplaza `vacia` cuando una acción de la barra movió el correo aquí
   *  (p. ej. Eliminar → Papelera). Sin ella la carpeta se ve vacía siempre,
   *  aunque el escenario acabe de mandar el correo a esa bandeja. */
  contenido?: ReactNode
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

/** Columna de carpetas del cliente de correo. Por defecto solo aporta el
 *  aspecto de cliente de escritorio. Si el escenario pasa carpetas navegables,
 *  esas entradas cambian la vista del cliente sin cerrar el escenario.
 *
 *  Vive aquí y no en cada pantalla porque estaba duplicada palabra por palabra
 *  en DeviceScreen y en el escenario interactivo, y las dos copias ya habían
 *  empezado a ser lo mismo escrito dos veces.
 *
 *  Iconos de trazo en vez de emoji: 📥 y 🗑 se dibujan distinto en cada
 *  sistema operativo —a color y con estilo propio— y le daban al cliente un
 *  aire de juguete que ningún correo real tiene. */
export function MailNav({
  activa,
  carpetas = [],
  onSelect,
}: {
  activa: string
  carpetas?: CarpetaCorreo[]
  onSelect?: (nombre: string) => void
}) {
  const carpetaPorNombre = new Map(carpetas.map((carpeta) => [carpeta.nombre, carpeta]))
  const navegable = Boolean(onSelect)

  function renderCarpeta(nombre: string, Icono: LucideIcon) {
    const carpeta = carpetaPorNombre.get(nombre)
    const className = `${styles.mailNavItem} ${nombre === activa ? styles.mailNavActive : ''}`
    const contenido = (
      <>
        <Icono aria-hidden className={styles.mailNavIcon} strokeWidth={1.75} />
        {nombre}
      </>
    )

    if (!navegable || (nombre !== 'Recibidos' && !carpeta)) {
      return <span className={className}>{contenido}</span>
    }

    return (
      <button
        type="button"
        className={className}
        title={`Abrir ${nombre}`}
        aria-label={`Abrir ${nombre}`}
        aria-current={nombre === activa ? 'page' : undefined}
        onClick={(event) => {
          event.stopPropagation()
          onSelect?.(nombre)
        }}
      >
        {contenido}
      </button>
    )
  }

  return (
    <nav className={styles.mailNav} aria-label="Carpetas del correo" aria-hidden={!navegable}>
      {renderCarpeta('Recibidos', Inbox)}
      {renderCarpeta('Enviados', Send)}
      {renderCarpeta('Spam', ShieldAlert)}
      {renderCarpeta('Papelera', Trash2)}
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
      {/* Minimizar, maximizar y cerrar. Decorativos, como el botón de inicio de
          la barra de tareas: son lo que hace que una ventana se lea como una
          ventana, y cerrarla de verdad sacaría al participante del ejercicio. */}
      <span className={styles.titlebarBotones} aria-hidden>
        <Minus className={styles.titlebarIcono} strokeWidth={2} />
        <Square className={styles.titlebarIconoCuadro} strokeWidth={2} />
        <X className={styles.titlebarIcono} strokeWidth={2} />
      </span>
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
  app,
  atajo,
  reloj = { hora: '10:41' },
}: {
  /** Programa en el que ya se está, anclado y sin acción: pulsar el icono de la
   *  app que tienes delante no hace nada en ningún sistema. */
  app?: { Icono: LucideIcon; texto: string }
  atajo?: AtajoTaskbar
  /** La hora del sistema.
   *
   *  `'vivo'` toma la hora real del equipo y la deja avanzar, que es lo que
   *  hace que la ventana se lea como el computador de quien está jugando. Solo
   *  sirve si el escenario también sitúa su mensaje en relación al ahora: un
   *  reloj real junto a un correo fechado a una hora fija vuelve a dejar dos
   *  relojes que se contradicen, que es el problema que esto viene a resolver.
   *
   *  Una hora fija sigue valiendo para los escenarios cuya historia depende de
   *  una hora concreta ("son casi las diez de la noche"). La fecha nunca se
   *  fija: siempre es la de hoy. */
  reloj?: Reloj
}) {
  const ahora = useRelojDelSistema()
  const hora = reloj === 'vivo' ? formatoHora(ahora) : reloj.hora

  return (
    <div className={styles.taskbar}>
      <span className={styles.taskbarStart} aria-hidden>
        <LayoutGrid className={styles.taskbarStartIcono} strokeWidth={2} />
      </span>
      <span className={styles.taskbarDivider} aria-hidden />

      {app && (
        <span className={`${styles.taskbarAtajo} ${styles.taskbarApp}`}>
          <app.Icono aria-hidden className={styles.taskbarAppIcono} strokeWidth={1.75} />
          {app.texto}
        </span>
      )}

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
        <Wifi className={styles.taskbarTrayIcono} strokeWidth={1.75} />
        <Volume2 className={styles.taskbarTrayIcono} strokeWidth={1.75} />
        <span className={styles.taskbarClock}>
          <span>{hora}</span>
          {/* La fecha es siempre la de hoy, aunque la hora esté fijada por el
              escenario: los mensajes llegan fechados "hoy 20:20". */}
          <span>{formatoFecha(ahora)}</span>
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
    <section
      className={`${styles.screen} ${styles.desktop}`}
      aria-label={ariaLabel}
      onClick={onClick}
    >
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
  carpetas?: CarpetaCorreo[]
  atajo?: AtajoTaskbar
  reloj?: Reloj
  /** Manejador delegado de puntos interactivos, si el escenario los usa. */
  onClick?: (event: React.MouseEvent) => void
  /** El adjunto entero, para que cada escenario decida si es pulsable. */
  adjunto?: ReactNode
  /** Pie institucional del mensaje. */
  pie?: ReactNode
  /** Destinatario del mensaje. Por defecto, la dirección de entrenamiento. */
  destinatario?: string
  /** Obliga a mostrar una carpeta concreta. Lo usa el repaso de señales: tras
   *  mandar el correo a Spam el participante se queda mirando esa carpeta, y
   *  el repaso necesita el mensaje delante para poder señalarlo. */
  carpetaForzada?: string
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
export function VentanaCorreo(props: VentanaCorreoProps) {
  const { atajo, reloj, onClick } = props

  return (
    <section
      className={`${styles.screen} ${styles.desktop}`}
      aria-label="Bandeja de correo"
      onClick={onClick}
    >
      <Titlebar texto="Correo (Recibidos)" />
      <CuerpoCorreo {...props} />
      <Taskbar atajo={atajo} reloj={reloj} />
    </section>
  )
}

/**
 * El correo sin la ventana que lo envuelve: carpetas, barra de acciones y
 * mensaje.
 *
 * Se separa de `VentanaCorreo` porque el mismo contenido tiene que poder vivir
 * dentro de una pestaña de navegador, donde no hay barra de título propia ni
 * franja de tareas — el navegador ya las pone. Sin esta división habría que
 * escribir el mensaje dos veces, que es justo lo que se arregló al unificar la
 * ventana.
 */
export function CuerpoCorreo({
  asunto,
  remitente,
  recibido,
  acciones,
  carpetas,
  adjunto,
  pie,
  destinatario,
  carpetaForzada,
  children,
}: VentanaCorreoProps) {
  const { correoSimulado } = useAuth()
  const [carpetaElegida, setCarpetaElegida] = useState('Recibidos')
  /// Qué mensaje se está leyendo. Es estado de la pantalla, no del ejercicio:
  /// abrir el recibo de la luz es mirar, como cambiar de pestaña, y por eso no
  /// pasa por el grafo ni entra en la traza de la corrida.
  const [leyendo, setLeyendo] = useState<string | null>(null)
  const carpetaActiva = carpetaForzada ?? carpetaElegida
  const carpetaSecundaria = carpetas?.find((carpeta) => carpeta.nombre === carpetaActiva)
  /// El mensaje del ejercicio sigue en Recibidos mientras nada lo haya movido.
  const enBandeja = !carpetaSecundaria || carpetaActiva !== 'Recibidos'
  const otro = OTROS_CORREOS.find((correo) => correo.id === leyendo)

  function abrir(id: string | null) {
    setLeyendo(id)
  }

  const cabecera = (
    nombre: string,
    direccion: string,
    fecha: string,
    etiqueta?: ReactNode,
    senalDireccion?: string,
  ) => (
    <div className={styles.senderRow}>
      <div className={styles.avatar} aria-hidden>
        {nombre.slice(0, 1).toUpperCase()}
      </div>
      <div className={styles.senderId}>
        <p className={styles.senderName}>
          {nombre}
          {etiqueta}
        </p>
        <p className={styles.senderAddr} data-signal={senalDireccion}>
          {direccion}
        </p>
        <p className={styles.senderTo}>para {destinatario ?? correoSimulado}</p>
      </div>
      <span className={styles.date}>{fecha}</span>
    </div>
  )

  return (
    <div className={styles.desktopBody}>
      <MailNav activa={carpetaActiva} carpetas={carpetas} onSelect={setCarpetaElegida} />

      {/* La lista de la bandeja. Solo en Recibidos: las otras carpetas del
          ejercicio muestran un mensaje suelto —el que se acaba de mover— y una
          lista ahí no diría nada. */}
      {carpetaActiva === 'Recibidos' && (
        <div className={styles.mailList} role="list" aria-label="Bandeja de entrada">
          {enBandeja && (
            <button
              type="button"
              role="listitem"
              className={`${styles.mailListItem} ${leyendo ? '' : styles.mailListActivo}`}
              onClick={() => abrir(null)}
            >
              <span className={styles.mailListDe}>{remitente.nombre}</span>
              <span className={styles.mailListAsunto}>{asunto}</span>
              <span className={styles.mailListHora}>{recibido}</span>
            </button>
          )}
          {OTROS_CORREOS.map((correo) => (
            <button
              key={correo.id}
              type="button"
              role="listitem"
              className={`${styles.mailListItem} ${styles.mailListLeido} ${
                leyendo === correo.id ? styles.mailListActivo : ''
              }`}
              onClick={() => abrir(correo.id)}
            >
              <span className={styles.mailListDe}>{correo.nombre}</span>
              <span className={styles.mailListAsunto}>{correo.asunto}</span>
              <span className={styles.mailListHora}>{correo.hora}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.mailPane}>
        {carpetaSecundaria && carpetaActiva !== 'Recibidos' ? (
          <div
            className={`${styles.mailbody} ${carpetaSecundaria.contenido ? '' : styles.mailFolderEmpty}`}
          >
            <h1 className={styles.subject}>{carpetaSecundaria.nombre}</h1>
            {carpetaSecundaria.contenido ?? <p>{carpetaSecundaria.vacia}</p>}
          </div>
        ) : otro ? (
          <>
            {/* Sin barra de acciones mientras se lee otro mensaje: responder o
                eliminar son decisiones sobre el correo del ejercicio, y desde
                aquí significarían otra cosa. En su lugar, la salida. */}
            <div className={styles.mailToolbar}>
              <button
                type="button"
                className={styles.mailToolbarBtn}
                title="Volver al mensaje del ejercicio"
                onClick={() => abrir(null)}
              >
                <ArrowLeft aria-hidden className={styles.mailToolbarIcon} strokeWidth={1.75} />
                <span aria-hidden className={styles.mailToolbarTexto}>
                  Volver
                </span>
              </button>
            </div>

            <div className={styles.mailbody}>
              <h1 className={styles.subject}>{otro.asunto}</h1>
              {cabecera(otro.nombre, otro.direccion, otro.hora)}
              <div className={styles.prose}>
                <p>{otro.cuerpo}</p>
              </div>
            </div>
          </>
        ) : !enBandeja ? (
          <div className={`${styles.mailbody} ${styles.mailFolderEmpty}`}>
            <h1 className={styles.subject}>Recibidos</h1>
            <p>{carpetaSecundaria?.vacia}</p>
          </div>
        ) : (
          <>
            {acciones && <MailToolbar acciones={acciones} />}

            <div className={styles.mailbody}>
              <h1 className={styles.subject}>{asunto}</h1>

              {cabecera(
                remitente.nombre,
                remitente.direccion,
                recibido,
                remitente.etiqueta && (
                  <span className={styles.label} data-signal={remitente.senalEtiqueta}>
                    {remitente.etiqueta}
                  </span>
                ),
                remitente.senalDireccion,
              )}

              <div className={styles.prose}>{children}</div>

              {adjunto && (
                <div className={styles.attachmentZone}>
                  <p className={styles.attachmentCount}>1 archivo adjunto</p>
                  {adjunto}
                </div>
              )}

              {pie && <div className={styles.mailFooter}>{pie}</div>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
