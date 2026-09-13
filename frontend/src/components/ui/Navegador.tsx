import {
  ArrowLeft,
  ArrowRight,
  EllipsisVertical,
  FileText,
  Globe,
  Lock,
  RotateCw,
  Star,
  TriangleAlert,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useAuth } from '../../context/AuthContext'
import { WindowButtons, Taskbar, type Clock } from './DesktopChrome'
import styles from './DeviceScreen.module.css'

// Navegador con pestañas reutilizado por los escenarios de correo/web.
// Ver docs/superpowers/specs/2026-08-05-escenarios-interactivos-phishing-design.md §2.1.

export interface TabConfig {
  titulo: string
  url: string
  segura: boolean
  /** Archivo abierto desde el disco: la barra muestra el nombre del archivo,
   *  sin candado ni "No seguro". Ninguno de los dos aplica a un archivo local,
   *  y el candado además enseñaría lo contrario de lo que mide el módulo. */
  local?: boolean
  /** Nodo al que lleva cerrar esta pestaña; si depende del recorrido, se deja
   *  sin definir y se resuelve con `cierrePortal` + `pestanaCierreDinamico`. */
  cierra?: string
  /** `data-signal` para que el repaso de señales pueda resaltar la URL de
   *  esta pestaña. */
  senalUrl?: string
}

export interface BrowserBookmark {
  Icono: LucideIcon
  texto: string
  /** Sin `goto` el marcador es decorativo: se ve pero no hace nada al
   *  pulsarlo, igual que los sitios de relleno de la barra de un navegador
   *  real. */
  goto?: string
  label?: string
}

interface BrowserProps {
  /** Todas las pestañas que el escenario puede llegar a mostrar, por id de
   *  nodo del grafo. */
  pestanas: Record<string, TabConfig>
  /** Las que están abiertas ahora mismo, en el orden en que se abrieron. */
  abiertas: string[]
  activa: string
  marcadores: BrowserBookmark[]
  /** Hora del sistema. Los escenarios cuya historia fija una hora la pasan
   *  para que el reloj de la ventana no la contradiga. */
  reloj?: Clock
  /** Final al que lleva cerrar la pestaña marcada como `pestanaCierreDinamico`
   *  cuando esa pestaña no trae su propio `cierra` fijo. */
  cierrePortal?: string
  pestanaCierreDinamico?: string
  onHotspot: (event: React.MouseEvent) => void
  children: ReactNode
}

export function Browser({
  pestanas: tabs,
  abiertas: open,
  activa: active,
  marcadores: markers,
  reloj: clock = 'vivo',
  cierrePortal: portalCompletion,
  pestanaCierreDinamico: dynamicClosingTab,
  onHotspot,
  children,
}: BrowserProps) {
  const current = tabs[active]
  /// La misma inicial que el cliente de correo usa para el avatar: es la misma
  /// persona, con su sesión abierta en el navegador.
  const { usuarioSimulado: simulatedUser } = useAuth()
  /// Con reserva: una cuenta ya anonimizada puede no tener nombre, y un avatar
  /// vacío no debería tumbar la pantalla entera.
  const initial = (simulatedUser || 'participante').slice(0, 1).toUpperCase()

  return (
    <section
      className={`${styles.screen} ${styles.desktop}`}
      aria-label="Navegador web"
      onClick={onHotspot}
    >
      {/* Sin barra de título aparte: las pestañas ocupan el borde superior,
          como en cualquier navegador. */}
      <div className={styles.tabstrip} role="tablist">
        {open.map((id) => {
          const meta = tabs[id]
          if (!meta) return null
          const isActive = id === active
          const closingTarget = id === dynamicClosingTab ? portalCompletion : meta.cierra

          return (
            <span
              key={id}
              className={`${styles.tab} ${isActive ? '' : styles.tabInactiva}`}
              role="tab"
              aria-selected={isActive}
              data-pestana={id}
              data-hotspot-goto={isActive ? undefined : id}
              data-hotspot-label={`Cambió a la pestaña "${meta.titulo}"`}
            >
              <Globe aria-hidden className={styles.tabIcono} strokeWidth={1.75} />
              <span className={styles.tabTexto}>{meta.titulo}</span>
              {closingTarget && (
                <button
                  type="button"
                  className={styles.tabClose}
                  title={`Cerrar ${meta.titulo}`}
                  aria-label={`Cerrar la pestaña ${meta.titulo}`}
                  data-cierra={id}
                  data-hotspot-goto={closingTarget}
                  data-hotspot-label={`Cerró la pestaña "${meta.titulo}"`}
                >
                  <X aria-hidden className={styles.tabCloseIcono} strokeWidth={2} />
                </button>
              )}
            </span>
          )
        })}
        <span className={styles.tabNueva} aria-hidden>
          +
        </span>
        <WindowButtons />
      </div>

      <div className={styles.urlbar}>
        {/* Atrás, adelante y recargar. Atrás y adelante van apagados a
            propósito: en una pestaña recién abierta no hay a dónde volver, y un
            navegador de verdad los pinta igual de grises. */}
        <span className={styles.navBotones} aria-hidden>
          <ArrowLeft className={`${styles.navIcono} ${styles.navIconoApagado}`} strokeWidth={2} />
          <ArrowRight className={`${styles.navIcono} ${styles.navIconoApagado}`} strokeWidth={2} />
          <RotateCw className={styles.navIcono} strokeWidth={2} />
        </span>

        {/* Iconos de trazo y no emoji: 🔒/⚠ varían según el sistema operativo
            y el indicador de seguridad es justo lo que este módulo enseña. */}
        {current?.local ? (
          <FileText aria-hidden className={styles.urlIcono} strokeWidth={1.75} />
        ) : current?.segura ? (
          <Lock aria-hidden className={`${styles.urlIcono} ${styles.lock}`} strokeWidth={2} />
        ) : (
          <span className={styles.warn}>
            <TriangleAlert aria-hidden className={styles.warnIcono} strokeWidth={2} />
            No seguro
          </span>
        )}
        <span className={styles.url} data-signal={current?.senalUrl}>
          {current?.url}
        </span>

        <span className={styles.navBotones} aria-hidden>
          <Star className={styles.navIcono} strokeWidth={2} />
          <span className={styles.navPerfil}>{initial}</span>
          <EllipsisVertical className={styles.navIcono} strokeWidth={2} />
        </span>
      </div>

      {markers.length > 0 && (
        <nav className={styles.marcadores} aria-label="Sitios guardados">
          {/* Nombrada porque sin marcadores conocidos la franja se lee como
              decoración; sigue sin decir cuál pulsar. */}
          <span className={styles.marcadoresCabecera}>
            <strong className={styles.marcadoresEtiqueta}>Sitios guardados</strong>
            <span className={styles.marcadoresAyuda}>
              Abre una entidad sin usar los enlaces del correo
            </span>
          </span>
          {markers.map(({ Icono: Icon, texto: text, goto, label }) => (
            <button
              key={text}
              type="button"
              className={styles.marcador}
              aria-label={`Abrir ${text}`}
              title={`Abrir ${text}`}
              data-hotspot-goto={goto}
              data-hotspot-label={label}
            >
              <Icon aria-hidden className={styles.marcadorIcono} strokeWidth={1.75} />
              {text}
            </button>
          ))}
        </nav>
      )}

      {children}

      <Taskbar apps={[{ Icono: Globe, texto: 'Navegador' }]} reloj={clock} />
    </section>
  )
}
