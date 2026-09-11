import {
  Building2,
  Gift,
  Inbox,
  Landmark,
  Lock,
  Minus,
  Power,
  School,
  ShieldCheck,
  Square,
  Store,
  X,
  LayoutGrid,
  Send,
  ShieldAlert,
  Trash2,
  Volume2,
  Wifi,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { formatoFecha, formatoHora, useRelojDelSistema } from '../../hooks/useRelojDelSistema'
import { useAuth } from '../../context/AuthContext'
import styles from './DeviceScreen.module.css'

/** Ventana abierta, tal como la lista la barra de tareas. */
export interface AppTaskbar {
  Icono: LucideIcon
  texto: string
  /** La que está al frente. La barra la marca, como cualquier escritorio. */
  activa?: boolean
  /** Traerla al frente. Sin esto la pastilla es decorativa: es lo que pasa en
   *  los escenarios de una sola ventana, donde no hay a qué cambiar. */
  onClick?: () => void
}

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

export type IconoMarcaCorreo =
  | 'empresa'
  | 'premio'
  | 'banco'
  | 'colegio'
  | 'seguridad'
  | 'tienda'

export type VarianteMarcaCorreo =
  | 'corporativa'
  | 'publicidad'
  | 'financiera'
  | 'institucional'
  | 'seguridad'

/** Identidad visual del remitente dentro del mensaje. La marca mejora el
 * realismo, pero nunca sustituye las señales del dominio y del contenido. */
export interface MarcaCorreo {
  nombre: string
  detalle: string
  icono: IconoMarcaCorreo
  variante: VarianteMarcaCorreo
}

const ICONOS_MARCA = {
  empresa: Building2,
  premio: Gift,
  banco: Landmark,
  colegio: School,
  seguridad: ShieldCheck,
  tienda: Store,
} satisfies Record<IconoMarcaCorreo, LucideIcon>

function IdentidadMarcaCorreo({ marca }: { marca: MarcaCorreo }) {
  const Icono = ICONOS_MARCA[marca.icono]

  return (
    <header
      role="group"
      className={`${styles.mailBrand} ${styles[`mailBrand_${marca.variante}`]}`}
      aria-label={`Identidad visual de ${marca.nombre}`}
    >
      <span className={styles.mailBrandIcono} aria-hidden>
        <Icono strokeWidth={1.8} />
      </span>
      <span className={styles.mailBrandTexto}>
        <strong>{marca.nombre}</strong>
        <span>{marca.detalle}</span>
      </span>
    </header>
  )
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
/** Minimizar, maximizar y cerrar. Decorativos, como el botón de inicio de la
 *  barra de tareas: son lo que hace que una ventana se lea como una ventana, y
 *  cerrarla de verdad sacaría al participante del ejercicio.
 *
 *  Sueltos de la barra de título porque el navegador no tiene: sus pestañas
 *  suben hasta el borde de la ventana y los botones van a su derecha, como en
 *  cualquier navegador desde hace diez años. */
export function BotonesVentana() {
  return (
    <span className={styles.titlebarBotones} aria-hidden>
      <Minus className={styles.titlebarIcono} strokeWidth={2} />
      <Square className={styles.titlebarIconoCuadro} strokeWidth={2} />
      <X className={styles.titlebarIcono} strokeWidth={2} />
    </span>
  )
}

export function Titlebar({ texto }: { texto: string }) {
  return (
    <div className={styles.titlebar}>
      <span className={styles.titlebarText}>{texto}</span>
      <BotonesVentana />
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
/**
 * El botón de encendido de la barra de tareas y su menú.
 *
 * Bloquear la sesión no es un botón suelto en ninguna parte: se hace desde
 * aquí, desde el teclado, o desde el menú de inicio. Un botón "Bloquear
 * pantalla" flotando en la barra no existe en ningún sistema, y un escenario
 * que enseña a bloquear no puede enseñarlo con un control inventado.
 *
 * Apagar se ve pero no responde, como el botón de inicio: es lo que hace que
 * el menú se lea como el del sistema. Apagar de verdad sacaría al participante
 * del ejercicio. Es la única entrada inerte que queda: un menú con tres
 * opciones grises y una viva era una lista de adorno con un botón dentro.
 */
export function BotonEnergia({ onBloquear }: { onBloquear: () => void }) {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!abierto) return
    function fuera(evento: MouseEvent) {
      if (!caja.current?.contains(evento.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [abierto])

  return (
    <span className={styles.energia} ref={caja}>
      {abierto && (
        <span className={styles.energiaMenu} role="menu">
          <button
            type="button"
            role="menuitem"
            className={styles.energiaItem}
            onClick={(evento) => {
              evento.stopPropagation()
              setAbierto(false)
              onBloquear()
            }}
          >
            <Lock aria-hidden className={styles.energiaIcono} strokeWidth={2} />
            Bloquear
          </button>
          <span
            role="menuitem"
            aria-disabled
            className={`${styles.energiaItem} ${styles.energiaItemApagado}`}
          >
            <Power aria-hidden className={styles.energiaIcono} strokeWidth={2} />
            Apagar
          </span>
        </span>
      )}

      <button
        type="button"
        className={styles.energiaBoton}
        title="Inicio / apagado"
        aria-label="Inicio y apagado"
        aria-expanded={abierto}
        aria-haspopup="menu"
        onClick={(evento) => {
          evento.stopPropagation()
          setAbierto((estaba) => !estaba)
        }}
      >
        <Power aria-hidden className={styles.energiaIcono} strokeWidth={2.25} />
      </button>
    </span>
  )
}

export function Taskbar({
  apps = [],
  atajo,
  onBloquear,
  reloj = { hora: '10:41' },
}: {
  /** Las ventanas abiertas. Con una sola —el navegador, el correo— es el
   *  programa en el que ya estás y no hace nada al pulsarlo, como en cualquier
   *  sistema. Con varias, la barra es la lista de lo que tienes abierto: la
   *  forma más rápida de ver que quedan tres aplicaciones sin cerrar. */
  apps?: AppTaskbar[]
  atajo?: AtajoTaskbar
  /** Si se pasa, la bandeja lleva el botón de encendido con su menú, y
   *  "Bloquear" llama a esto. Ver BotonEnergia. */
  onBloquear?: () => void
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
      {/* Junto al de inicio, que es de donde cuelga apagar en cualquier
          escritorio. En la bandeja, entre el wifi y el volumen, era un icono
          gris de dieciséis píxeles que nadie encontraba. */}
      {onBloquear && <BotonEnergia onBloquear={onBloquear} />}
      <span className={styles.taskbarDivider} aria-hidden />

      {apps.map(({ Icono, texto, activa, onClick }) =>
        onClick ? (
          <button
            key={texto}
            type="button"
            className={`${styles.taskbarAtajo} ${activa ? styles.taskbarAppActiva : ''}`}
            title={`Ir a ${texto}`}
            aria-current={activa ? 'true' : undefined}
            onClick={(evento) => {
              evento.stopPropagation()
              onClick()
            }}
          >
            <Icono aria-hidden className={styles.taskbarAppIcono} strokeWidth={1.75} />
            {texto}
          </button>
        ) : (
          <span key={texto} className={`${styles.taskbarAtajo} ${styles.taskbarApp}`}>
            <Icono aria-hidden className={styles.taskbarAppIcono} strokeWidth={1.75} />
            {texto}
          </span>
        ),
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

export interface VentanaCorreoProps {
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
  /** Cabecera visual que una entidad real incluiría en su plantilla. */
  marca?: MarcaCorreo
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
  marca,
  children,
}: VentanaCorreoProps) {
  const { correoSimulado } = useAuth()
  const [carpetaElegida, setCarpetaElegida] = useState('Recibidos')
  const carpetaActiva = carpetaForzada ?? carpetaElegida
  const carpetaSecundaria = carpetas?.find((carpeta) => carpeta.nombre === carpetaActiva)

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

      <div className={styles.mailPane}>
        {carpetaSecundaria ? (
          <div
            className={`${styles.mailbody} ${carpetaSecundaria.contenido ? '' : styles.mailFolderEmpty}`}
          >
            <h1 className={styles.subject}>{carpetaSecundaria.nombre}</h1>
            {carpetaSecundaria.contenido ?? <p>{carpetaSecundaria.vacia}</p>}
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

              {marca && <IdentidadMarcaCorreo marca={marca} />}

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
