import { Paperclip } from 'lucide-react'
import { Taskbar, Titlebar, VentanaCorreo, type AccionCorreo } from './DesktopChrome'
import styles from './DeviceScreen.module.css'

/**
 * Pantallas simuladas compartidas por los escenarios de correo y SMS. Solo
 * dibujan lo que la app real mostraría (regla diegética de EscenarioLayout);
 * las preguntas y el feedback viven fuera del marco.
 *
 * Los campos de formulario no son editables a propósito: el participante juzga
 * una pantalla, nunca escribe credenciales reales en ella.
 */
export type ScreenView =
  | {
      kind: 'mail'
      from: string
      address: string
      subject: string
      date: string
      /** HTML fijo del escenario, nunca contenido de un usuario. Puede llevar
       *  `data-signal` en cualquier elemento para que el repaso lo resalte. */
      body: string
      /** Pie institucional del mensaje. HTML fijo, como `body`. */
      footer?: string
      attachment?: string
      /** Etiqueta del cliente de correo: "Promociones", "Externo"… */
      label?: string
      /** `data-signal` del repaso para la dirección, la etiqueta y el adjunto. */
      senalDireccion?: string
      senalEtiqueta?: string
      senalAdjunto?: string
    }
  | {
      kind: 'web'
      url: string
      /** Candado del navegador. Falso pinta la advertencia "No seguro". */
      secure: boolean
      brand: string
      title: string
      subtitle?: string
      fields: { label: string; placeholder: string; senal?: string }[]
      button: string
      footer?: string
      /** `data-signal` de la barra de direcciones. */
      senalUrl?: string
    }
  | {
      kind: 'sms'
      sender: string
      sub: string
      msgs: { text: string; time: string; mine?: boolean }[]
    }

function DeviceScreen({
  view,
  acciones,
  onHotspot,
}: {
  view: ScreenView
  /** Barra de acciones del cliente. Solo se pinta si el escenario declara sus
   *  finales; sin ellos los botones no tendrían a dónde saltar. */
  acciones?: AccionCorreo[]
  onHotspot?: (event: React.MouseEvent) => void
}) {
  if (view.kind === 'mail') {
    return (
      <VentanaCorreo
        acciones={acciones}
        onClick={onHotspot}
        asunto={view.subject}
        remitente={{
          nombre: view.from,
          direccion: view.address,
          etiqueta: view.label,
          senalDireccion: view.senalDireccion,
          senalEtiqueta: view.senalEtiqueta,
        }}
        recibido={view.date}
        adjunto={
          view.attachment && (
            <span className={styles.attachment} data-signal={view.senalAdjunto}>
              <span className={styles.attachmentTipo} aria-hidden>
                <Paperclip className={styles.attachmentIcono} strokeWidth={1.75} />
              </span>
              <span className={styles.attachmentNombre}>{view.attachment}</span>
            </span>
          )
        }
        pie={view.footer && <div dangerouslySetInnerHTML={{ __html: view.footer }} />}
      >
        {/* Contenido fijo del escenario: permite negritas y el enlace falso. */}
        <div dangerouslySetInnerHTML={{ __html: view.body }} />
      </VentanaCorreo>
    )
  }

  if (view.kind === 'web') {
    return (
      <section className={`${styles.screen} ${styles.desktop}`} aria-label="Página web simulada">
        <Titlebar texto={view.title} />

        {/* Pestaña de navegador: en el celular no hay pestañas visibles, y es
            la segunda señal más fuerte de que esto es un computador. */}
        <div className={styles.tabstrip} aria-hidden>
          <span className={styles.tab}>{view.title}</span>
        </div>

        <div className={styles.urlbar}>
          <span className={view.secure ? styles.lock : styles.warn}>
            {view.secure ? '🔒' : '⚠ No seguro'}
          </span>
          <span className={styles.url} data-signal={view.senalUrl}>
            {view.url}
          </span>
        </div>

        <div className={styles.page}>
          <p className={styles.brand}>{view.brand}</p>
          <h2 className={styles.pageTitle}>{view.title}</h2>
          {view.subtitle && <p className={styles.pageSub}>{view.subtitle}</p>}

          <div className={styles.form}>
            {view.fields.map((field) => (
              <label key={field.label} className={styles.field} data-signal={field.senal}>
                <span>{field.label}</span>
                <span className={styles.input}>{field.placeholder}</span>
              </label>
            ))}
            <div className={styles.submit}>{view.button}</div>
          </div>

          {view.footer && <p className={styles.pageFooter}>{view.footer}</p>}
        </div>

        <Taskbar />
      </section>
    )
  }

  return (
    <section className={`${styles.screen} ${styles.sms}`} aria-label="Mensajes de texto">
      <div className={styles.smsbar}>
        <div className={styles.smsId}>
          <p className={styles.smsName}>{view.sender}</p>
          <p className={styles.smsSub}>{view.sub}</p>
        </div>
      </div>

      <div className={styles.smsThread}>
        {view.msgs.map((msg) => (
          <div
            key={msg.text}
            className={`${styles.smsRow} ${msg.mine ? styles.mine : styles.theirs}`}
          >
            <div className={styles.smsBubble}>
              <span dangerouslySetInnerHTML={{ __html: msg.text }} />
              <span className={styles.smsTime}>{msg.time}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.smsComposer}>
        <div className={styles.smsField}>Mensaje de texto</div>
      </div>
    </section>
  )
}

export default DeviceScreen
