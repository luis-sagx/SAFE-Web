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

export interface AppTaskbar {
  Icono: LucideIcon
  texto: string
  activa?: boolean
  onClick?: () => void
}

export interface AtajoTaskbar {
  texto: string
  goto: string
  label: string
}

// Solo la hora; la fecha siempre es la de hoy (los correos llegan fechados
// "hoy 20:20", una fecha inventada contradeciría al mensaje).
export type Reloj = { hora: string } | 'vivo'

export interface AccionCorreo {
  Icono: LucideIcon
  etiqueta: string
  titulo: string
  goto: string
  label: string
}

export interface CarpetaCorreo {
  nombre: string
  vacia: string
  // Reemplaza `vacia` cuando una acción de la barra movió el correo aquí.
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

// La marca mejora el realismo, pero nunca sustituye las señales de dominio y contenido.
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

// Cada acción lleva su nombre bajo el icono (mide si reconoce un fraude, no
// si interpreta pictogramas) y todas son reales, ninguna decorativa.
export function MailToolbar({ acciones }: { acciones: AccionCorreo[] }) {
  return (
    <div className={styles.mailToolbar} role="toolbar" aria-label="Acciones del correo">
      {acciones.map(({ Icono, etiqueta, titulo, goto, label }) => (
        <button
          key={goto}
          type="button"
          className={styles.mailToolbarBtn}
          title={titulo}
          // etiqueta puede ir abreviada; lo anunciado es siempre el nombre completo.
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

// Vive aquí y no en cada pantalla: estaba duplicada palabra por palabra en
// DeviceScreen y en el escenario interactivo. Iconos de trazo, no emoji
// (📥/🗑 se dibujan distinto por sistema y dan aire de juguete).
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

// Decorativos: son lo que hace que una ventana se lea como ventana sin
// depender de un estilo de botones concreto (macOS/Windows).
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

// Bloquear la sesión no es un botón suelto: solo existe aquí, como en un
// sistema real. Apagar se ve pero no responde (evita sacar al participante).
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
  apps?: AppTaskbar[]
  atajo?: AtajoTaskbar
  // Ver BotonEnergia.
  onBloquear?: () => void
  // 'vivo' toma la hora real del equipo; una fija sirve cuando la historia
  // depende de una hora concreta. La fecha siempre es la de hoy.
  reloj?: Reloj
}) {
  const ahora = useRelojDelSistema()
  const hora = reloj === 'vivo' ? formatoHora(ahora) : reloj.hora

  return (
    <div className={styles.taskbar}>
      <span className={styles.taskbarStart} aria-hidden>
        <LayoutGrid className={styles.taskbarStartIcono} strokeWidth={2} />
      </span>
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
          <span>{formatoFecha(ahora)}</span>
        </span>
      </span>
    </div>
  )
}

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

export interface RemitenteCorreo {
  nombre: string
  direccion: string
  etiqueta?: string
  senalDireccion?: string
  senalEtiqueta?: string
}

export interface VentanaCorreoProps {
  asunto: string
  remitente: RemitenteCorreo
  recibido: string
  // Sin ella no se pinta: una barra que no responde se ve rota.
  acciones?: AccionCorreo[]
  carpetas?: CarpetaCorreo[]
  atajo?: AtajoTaskbar
  reloj?: Reloj
  onClick?: (event: React.MouseEvent) => void
  adjunto?: ReactNode
  pie?: ReactNode
  destinatario?: string
  // Fuerza una carpeta durante el repaso de señales, para señalar el mensaje.
  carpetaForzada?: string
  marca?: MarcaCorreo
  children: ReactNode
}

// Unifica el cliente de correo, que estaba escrito dos veces (DeviceScreen y
// el escenario interactivo) y ya había divergido entre las dos copias.
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

// Se separa de VentanaCorreo porque el mismo contenido vive también dentro
// de una pestaña de navegador, que ya pone su propia barra de título.
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
          de: {direccion}
        </p>
        <p className={styles.senderTo}>para: {destinatario ?? correoSimulado}</p>
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
