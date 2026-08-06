import { Globe, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Taskbar, Titlebar, type Reloj } from './DesktopChrome'
import styles from './DeviceScreen.module.css'

/**
 * El navegador con pestañas de los escenarios interactivos de phishing.
 * Extraído de FacturaSri.tsx (primer escenario en usar esta mecánica) para
 * que el resto de escenarios de correo/web lo reutilicen sin copiarlo. Ver
 * docs/superpowers/specs/2026-08-05-escenarios-interactivos-phishing-design.md
 * §2.1.
 */

export interface PestanaConfig {
  titulo: string
  url: string
  segura: boolean
  /** Archivo abierto desde el disco: la barra muestra el nombre del archivo,
   *  sin candado ni "No seguro". Ninguno de los dos aplica a un archivo local,
   *  y el candado además enseñaría lo contrario de lo que mide el módulo. */
  local?: boolean
  /** Nodo al que lleva cerrar esta pestaña. Si la pestaña decide su cierre en
   *  tiempo de ejecución (p. ej. según si se visitó otra pantalla antes), se
   *  deja sin definir aquí y se resuelve con `cierrePortal` +
   *  `pestanaCierreDinamico`. */
  cierra?: string
  /** `data-signal` para que el repaso de señales pueda resaltar la URL de
   *  esta pestaña. */
  senalUrl?: string
}

export interface MarcadorNavegador {
  Icono: LucideIcon
  texto: string
  /** Sin `goto` el marcador es decorativo: se ve pero no hace nada al
   *  pulsarlo, igual que los sitios de relleno de la barra de un navegador
   *  real. */
  goto?: string
  label?: string
}

interface NavegadorProps {
  /** Todas las pestañas que el escenario puede llegar a mostrar, por id de
   *  nodo del grafo. */
  pestanas: Record<string, PestanaConfig>
  /** Las que están abiertas ahora mismo, en el orden en que se abrieron. */
  abiertas: string[]
  activa: string
  marcadores: MarcadorNavegador[]
  /** Hora del sistema. Los escenarios cuya historia fija una hora la pasan
   *  para que el reloj de la ventana no la contradiga. */
  reloj?: Reloj
  /** Final al que lleva cerrar la pestaña marcada como `pestanaCierreDinamico`
   *  cuando esa pestaña no trae su propio `cierra` fijo. */
  cierrePortal?: string
  pestanaCierreDinamico?: string
  onHotspot: (event: React.MouseEvent) => void
  children: ReactNode
}

export function Navegador({
  pestanas,
  abiertas,
  activa,
  marcadores,
  reloj = 'vivo',
  cierrePortal,
  pestanaCierreDinamico,
  onHotspot,
  children,
}: NavegadorProps) {
  const actual = pestanas[activa]

  return (
    <section
      className={`${styles.screen} ${styles.desktop}`}
      aria-label="Navegador web"
      onClick={onHotspot}
    >
      <Titlebar texto="Navegador" />

      <div className={styles.tabstrip} role="tablist">
        {abiertas.map((id) => {
          const meta = pestanas[id]
          if (!meta) return null
          const esActiva = id === activa
          const cierra = id === pestanaCierreDinamico ? cierrePortal : meta.cierra

          return (
            <span
              key={id}
              className={`${styles.tab} ${esActiva ? '' : styles.tabInactiva}`}
              role="tab"
              aria-selected={esActiva}
              data-pestana={id}
              data-hotspot-goto={esActiva ? undefined : id}
              data-hotspot-label={`Cambió a la pestaña "${meta.titulo}"`}
            >
              <Globe aria-hidden className={styles.tabIcono} strokeWidth={1.75} />
              <span className={styles.tabTexto}>{meta.titulo}</span>
              {cierra && (
                <button
                  type="button"
                  className={styles.tabClose}
                  title={`Cerrar ${meta.titulo}`}
                  aria-label={`Cerrar la pestaña ${meta.titulo}`}
                  data-cierra={id}
                  data-hotspot-goto={cierra}
                  data-hotspot-label={`Cerró la pestaña "${meta.titulo}"`}
                >
                  ✕
                </button>
              )}
            </span>
          )
        })}
        <span className={styles.tabNueva} aria-hidden>
          +
        </span>
      </div>

      <div className={styles.urlbar}>
        {actual?.local ? (
          <span className={styles.lock}>📄</span>
        ) : actual?.segura ? (
          <span className={styles.lock}>🔒</span>
        ) : (
          <span className={styles.warn}>⚠ No seguro</span>
        )}
        <span className={styles.url} data-signal={actual?.senalUrl}>
          {actual?.url}
        </span>
      </div>

      {marcadores.length > 0 && (
        <div className={styles.marcadores}>
          {marcadores.map(({ Icono, texto, goto, label }) => (
            <button
              key={texto}
              type="button"
              className={styles.marcador}
              data-hotspot-goto={goto}
              data-hotspot-label={label}
            >
              <Icono aria-hidden className={styles.marcadorIcono} strokeWidth={1.75} />
              {texto}
            </button>
          ))}
        </div>
      )}

      {children}

      <Taskbar app="🌐 Navegador" reloj={reloj} />
    </section>
  )
}
