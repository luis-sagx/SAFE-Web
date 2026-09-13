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
import { formatDate, formatTime, useSystemClock } from '../../hooks/useRelojDelSistema'
import { useAuth } from '../../context/AuthContext'
import styles from './DeviceScreen.module.css'

export interface AppTaskbar {
  Icono: LucideIcon
  texto: string
  activa?: boolean
  onClick?: () => void
}

export interface TaskbarShortcut {
  texto: string
  goto: string
  label: string
}

// Solo la hora; la fecha siempre es la de hoy (los correos llegan fechados
// "hoy 20:20", una fecha inventada contradeciría al mensaje).
export type Clock = { hora: string } | 'vivo'

export interface EmailAction {
  Icono: LucideIcon
  etiqueta: string
  titulo: string
  goto: string
  label: string
}

export interface EmailFolder {
  nombre: string
  vacia: string
  // Reemplaza `vacia` cuando una acción de la barra movió el correo aquí.
  contenido?: ReactNode
}

export type EmailBrandIcon =
  | 'empresa'
  | 'premio'
  | 'banco'
  | 'colegio'
  | 'seguridad'
  | 'tienda'

export type EmailBrandVariant =
  | 'corporativa'
  | 'publicidad'
  | 'financiera'
  | 'institucional'
  | 'seguridad'

// La marca mejora el realismo, pero nunca sustituye las señales de dominio y contenido.
export interface EmailBrand {
  nombre: string
  detalle: string
  icono: EmailBrandIcon
  variante: EmailBrandVariant
}

const BRAND_ICONS = {
  empresa: Building2,
  premio: Gift,
  banco: Landmark,
  colegio: School,
  seguridad: ShieldCheck,
  tienda: Store,
} satisfies Record<EmailBrandIcon, LucideIcon>

function EmailBrandIdentity({ marca: brand }: { marca: EmailBrand }) {
  const Icon = BRAND_ICONS[brand.icono]

  return (
    <header
      role="group"
      className={`${styles.mailBrand} ${styles[`mailBrand_${brand.variante}`]}`}
      aria-label={`Identidad visual de ${brand.nombre}`}
    >
      <span className={styles.mailBrandIcono} aria-hidden>
        <Icon strokeWidth={1.8} />
      </span>
      <span className={styles.mailBrandTexto}>
        <strong>{brand.nombre}</strong>
        <span>{brand.detalle}</span>
      </span>
    </header>
  )
}

// Cada acción lleva su nombre bajo el icono (mide si reconoce un fraude, no
// si interpreta pictogramas) y todas son reales, ninguna decorativa.
export function MailToolbar({ acciones: actions }: { acciones: EmailAction[] }) {
  return (
    <div className={styles.mailToolbar} role="toolbar" aria-label="Acciones del correo">
      {actions.map(({ Icono: Icon, etiqueta: displayLabel, titulo: title, goto, label: decisionLabel }) => (
        <button
          key={goto}
          type="button"
          className={styles.mailToolbarBtn}
          title={title}
          // etiqueta puede ir abreviada; lo anunciado es siempre el nombre completo.
          aria-label={title}
          data-hotspot-goto={goto}
          data-hotspot-label={decisionLabel}
        >
          <Icon aria-hidden className={styles.mailToolbarIcon} strokeWidth={1.75} />
          <span aria-hidden className={styles.mailToolbarTexto}>
            {displayLabel}
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
  activa: active,
  carpetas: folders = [],
  onSelect,
}: {
  activa: string
  carpetas?: EmailFolder[]
  onSelect?: (name: string) => void
}) {
  const folderByName = new Map(folders.map((folder) => [folder.nombre, folder]))
  const navigable = Boolean(onSelect)

  function renderFolder(name: string, Icon: LucideIcon) {
    const folder = folderByName.get(name)
    const className = `${styles.mailNavItem} ${name === active ? styles.mailNavActive : ''}`
    const content = (
      <>
        <Icon aria-hidden className={styles.mailNavIcon} strokeWidth={1.75} />
        {name}
      </>
    )

    if (!navigable || (name !== 'Recibidos' && !folder)) {
      return <span className={className}>{content}</span>
    }

    return (
      <button
        type="button"
        className={className}
        title={`Abrir ${name}`}
        aria-label={`Abrir ${name}`}
        aria-current={name === active ? 'page' : undefined}
        onClick={(event) => {
          event.stopPropagation()
          onSelect?.(name)
        }}
      >
        {content}
      </button>
    )
  }

  return (
    <nav className={styles.mailNav} aria-label="Carpetas del correo" aria-hidden={!navigable}>
      {renderFolder('Recibidos', Inbox)}
      {renderFolder('Enviados', Send)}
      {renderFolder('Spam', ShieldAlert)}
      {renderFolder('Papelera', Trash2)}
    </nav>
  )
}

// Decorativos: son lo que hace que una ventana se lea como ventana sin
// depender de un estilo de botones concreto (macOS/Windows).
export function WindowButtons() {
  return (
    <span className={styles.titlebarBotones} aria-hidden>
      <Minus className={styles.titlebarIcono} strokeWidth={2} />
      <Square className={styles.titlebarIconoCuadro} strokeWidth={2} />
      <X className={styles.titlebarIcono} strokeWidth={2} />
    </span>
  )
}

export function Titlebar({ texto: text }: { texto: string }) {
  return (
    <div className={styles.titlebar}>
      <span className={styles.titlebarText}>{text}</span>
      <WindowButtons />
    </div>
  )
}

// Bloquear la sesión no es un botón suelto: solo existe aquí, como en un
// sistema real. Apagar se ve pero no responde (evita sacar al participante).
export function PowerButton({ onBloquear: onBlock }: { onBloquear: () => void }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    function outside(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [open])

  return (
    <span className={styles.energia} ref={box}>
      {open && (
        <span className={styles.energiaMenu} role="menu">
          <button
            type="button"
            role="menuitem"
            className={styles.energiaItem}
            onClick={(event) => {
              event.stopPropagation()
              setOpen(false)
              onBlock()
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
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(event) => {
          event.stopPropagation()
          setOpen((was) => !was)
        }}
      >
        <Power aria-hidden className={styles.energiaIcono} strokeWidth={2.25} />
      </button>
    </span>
  )
}

export function Taskbar({
  apps = [],
  atajo: shortcut,
  onBloquear: onBlock,
  reloj: clock = { hora: '10:41' },
}: {
  apps?: AppTaskbar[]
  atajo?: TaskbarShortcut
  // Ver BotonEnergia.
  onBloquear?: () => void
  // 'vivo' toma la hora real del equipo; una fija sirve cuando la historia
  // depende de una hora concreta. La fecha siempre es la de hoy.
  reloj?: Clock
}) {
  const now = useSystemClock()
  const time = clock === 'vivo' ? formatTime(now) : clock.hora

  return (
    <div className={styles.taskbar}>
      <span className={styles.taskbarStart} aria-hidden>
        <LayoutGrid className={styles.taskbarStartIcono} strokeWidth={2} />
      </span>
      {onBlock && <PowerButton onBloquear={onBlock} />}
      <span className={styles.taskbarDivider} aria-hidden />

      {apps.map(({ Icono: Icon, texto: text, activa: active, onClick }) =>
        onClick ? (
          <button
            key={text}
            type="button"
            className={`${styles.taskbarAtajo} ${active ? styles.taskbarAppActiva : ''}`}
            title={`Ir a ${text}`}
            aria-current={active ? 'true' : undefined}
            onClick={(event) => {
              event.stopPropagation()
              onClick()
            }}
          >
            <Icon aria-hidden className={styles.taskbarAppIcono} strokeWidth={1.75} />
            {text}
          </button>
        ) : (
          <span key={text} className={`${styles.taskbarAtajo} ${styles.taskbarApp}`}>
            <Icon aria-hidden className={styles.taskbarAppIcono} strokeWidth={1.75} />
            {text}
          </span>
        ),
      )}

      {shortcut && (
        <button
          type="button"
          className={styles.taskbarAtajo}
          title={`Abrir ${shortcut.texto.replace(/^[^\p{L}\d]+/u, '')}`}
          data-hotspot-goto={shortcut.goto}
          data-hotspot-label={shortcut.label}
        >
          {shortcut.texto}
        </button>
      )}

      <span className={styles.taskbarTray} aria-hidden>
        <Wifi className={styles.taskbarTrayIcono} strokeWidth={1.75} />
        <Volume2 className={styles.taskbarTrayIcono} strokeWidth={1.75} />
        <span className={styles.taskbarClock}>
          <span>{time}</span>
          <span>{formatDate(now)}</span>
        </span>
      </span>
    </div>
  )
}

export function DesktopWindow({
  titulo: title,
  atajo: shortcut,
  reloj: clock,
  onClick,
  ariaLabel,
  children,
}: {
  titulo: string
  atajo?: TaskbarShortcut
  reloj?: Clock
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
      <Titlebar texto={title} />
      {children}
      <Taskbar atajo={shortcut} reloj={clock} />
    </section>
  )
}

export interface EmailSender {
  nombre: string
  direccion: string
  etiqueta?: string
  senalDireccion?: string
  senalEtiqueta?: string
}

export interface EmailWindowProps {
  asunto: string
  remitente: EmailSender
  recibido: string
  // Sin ella no se pinta: una barra que no responde se ve rota.
  acciones?: EmailAction[]
  carpetas?: EmailFolder[]
  atajo?: TaskbarShortcut
  reloj?: Clock
  onClick?: (event: React.MouseEvent) => void
  adjunto?: ReactNode
  pie?: ReactNode
  destinatario?: string
  // Fuerza una carpeta durante el repaso de señales, para señalar el mensaje.
  carpetaForzada?: string
  marca?: EmailBrand
  children: ReactNode
}

// Unifica el cliente de correo, que estaba escrito dos veces (DeviceScreen y
// el escenario interactivo) y ya había divergido entre las dos copias.
export function EmailWindow(props: EmailWindowProps) {
  const { atajo: shortcut, reloj: clock, onClick } = props

  return (
    <section
      className={`${styles.screen} ${styles.desktop}`}
      aria-label="Bandeja de correo"
      onClick={onClick}
    >
      <Titlebar texto="Correo (Recibidos)" />
      <EmailBody {...props} />
      <Taskbar atajo={shortcut} reloj={clock} />
    </section>
  )
}

// Se separa de VentanaCorreo porque el mismo contenido vive también dentro
// de una pestaña de navegador, que ya pone su propia barra de título.
export function EmailBody({
  asunto: subject,
  remitente: sender,
  recibido: received,
  acciones: actions,
  carpetas: folders,
  adjunto: attachment,
  pie,
  destinatario: recipient,
  carpetaForzada: forcedFolder,
  marca: brand,
  children,
}: EmailWindowProps) {
  const { correoSimulado: simulatedEmail } = useAuth()
  const [selectedFolder, setFolderSelected] = useState('Recibidos')
  const activeFolder = forcedFolder ?? selectedFolder
  const secondaryFolder = folders?.find((folder) => folder.nombre === activeFolder)

  const header = (
    name: string,
    address: string,
    date: string,
    label?: ReactNode,
    addressSignal?: string,
  ) => (
    <div className={styles.senderRow}>
      <div className={styles.avatar} aria-hidden>
        {name.slice(0, 1).toUpperCase()}
      </div>
      <div className={styles.senderId}>
        <p className={styles.senderName}>
          {name}
          {label}
        </p>
        <p className={styles.senderAddr} data-signal={addressSignal}>
          de: {address}
        </p>
        <p className={styles.senderTo}>para: {recipient ?? simulatedEmail}</p>
      </div>
      <span className={styles.date}>{date}</span>
    </div>
  )

  return (
    <div className={styles.desktopBody}>
      <MailNav activa={activeFolder} carpetas={folders} onSelect={setFolderSelected} />

      <div className={styles.mailPane}>
        {secondaryFolder ? (
          <div
            className={`${styles.mailbody} ${secondaryFolder.contenido ? '' : styles.mailFolderEmpty}`}
          >
            <h1 className={styles.subject}>{secondaryFolder.nombre}</h1>
            {secondaryFolder.contenido ?? <p>{secondaryFolder.vacia}</p>}
          </div>
        ) : (
          <>
            {actions && <MailToolbar acciones={actions} />}

            <div className={styles.mailbody}>
              <h1 className={styles.subject}>{subject}</h1>

              {header(
                sender.nombre,
                sender.direccion,
                received,
                sender.etiqueta && (
                  <span className={styles.label} data-signal={sender.senalEtiqueta}>
                    {sender.etiqueta}
                  </span>
                ),
                sender.senalDireccion,
              )}

              {brand && <EmailBrandIdentity marca={brand} />}

              <div className={styles.prose}>{children}</div>

              {attachment && (
                <div className={styles.attachmentZone}>
                  <p className={styles.attachmentCount}>1 archivo adjunto</p>
                  {attachment}
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
