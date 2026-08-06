import { Paperclip } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { CuerpoCorreo, type AccionCorreo, type CarpetaCorreo } from './DesktopChrome'
import styles from './DeviceScreen.module.css'

/**
 * Contenido de las pantallas simuladas de correo, web y SMS. Solo dibuja lo que
 * la app real mostraría (regla diegética de EscenarioLayout); las preguntas y
 * el feedback viven fuera del marco.
 *
 * El correo y la web devuelven contenido a secas, sin ventana: van dentro de
 * una pestaña del navegador, que es quien pone la barra de título, la de
 * direcciones y la de tareas. El SMS conserva su propio marco porque no es una
 * página web sino un teléfono.
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
      /** Nodo al que lleva abrir el adjunto. Sin esto el adjunto es de adorno:
       *  se ve pero no se abre, que es justo lo que un participante intenta
       *  hacer primero cuando el correo dice "adjunto el comprobante". */
      adjuntoGoto?: string
      adjuntoLabel?: string
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
      /** Archivo abierto desde el disco (un adjunto descargado, p. ej.). No
       *  lleva candado ni advertencia: poner candado a un archivo local
       *  enseñaría justo lo contrario de lo que mide este módulo. */
      local?: boolean
      brand: string
      title: string
      subtitle?: string
      fields: {
        label: string
        placeholder: string
        senal?: string
        /** Rellena el campo con los datos del participante en vez del texto de
         *  ejemplo. Un formulario que ya trae *tu* correo se lee como el de un
         *  sitio que te conoce, que es media trampa; y de paso deja tu dominio
         *  real a la vista, junto al falso de la barra de direcciones. */
        valor?: 'correo' | 'usuario'
      }[]
      /** Datos de una página informativa. Cuando los hay, sustituyen al
       *  formulario: un directorio no se rellena, se lee. */
      datos?: { etiqueta: string; valor: string; senal?: string }[]
      button: string
      footer?: string
      /** `data-signal` de la barra de direcciones. */
      senalUrl?: string
      /** Nodo al que lleva enviar el formulario. Sin esto el botón es de
       *  adorno, y un botón de envío que no responde es lo que menos se
       *  perdona en una pantalla que imita a una real. */
      botonGoto?: string
      botonLabel?: string
      /** Nodo al que lleva cerrar la pestaña de esta página. Sin esto la
       *  pestaña no lleva la ✕: cerrar tiene que significar algo. */
      cerrarGoto?: string
      cerrarLabel?: string
    }
  | {
      kind: 'sms'
      sender: string
      sub: string
      msgs: { text: string; time: string; mine?: boolean }[]
    }

/// El botón de una página simulada, sea el envío de un formulario o la acción
/// única de una página informativa ("llamar a este número"). Sin `botonGoto`
/// se pinta igual pero no responde: hay páginas donde el botón es decorado.
function Accion({ view }: { view: Extract<ScreenView, { kind: 'web' }> }) {
  if (!view.botonGoto) return <div className={styles.submit}>{view.button}</div>

  return (
    <button
      type="button"
      className={`${styles.hotspot} ${styles.submit}`}
      data-hotspot-goto={view.botonGoto}
      data-hotspot-label={view.botonLabel}
    >
      {view.button}
    </button>
  )
}

function DeviceScreen({
  view,
  acciones,
  carpetas,
  destinatario,
  carpetaForzada,
}: {
  view: ScreenView
  /** Barra de acciones del cliente. Solo se pinta si el escenario declara sus
   *  finales; sin ellos los botones no tendrían a dónde saltar. */
  acciones?: AccionCorreo[]
  carpetas?: CarpetaCorreo[]
  destinatario?: string
  carpetaForzada?: string
}) {
  const { correoSimulado } = useAuth()
  const correo = destinatario ?? correoSimulado
  const usuario = correo.split('@')[0]

  if (view.kind === 'mail') {
    return (
      <CuerpoCorreo
        acciones={acciones}
        carpetas={carpetas}
        destinatario={destinatario}
        carpetaForzada={carpetaForzada}
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
            <span
              className={styles.attachment}
              data-signal={view.senalAdjunto}
              data-hotspot-goto={view.adjuntoGoto}
              data-hotspot-label={view.adjuntoLabel}
              role={view.adjuntoGoto ? 'button' : undefined}
              tabIndex={view.adjuntoGoto ? 0 : undefined}
            >
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
      </CuerpoCorreo>
    )
  }

  if (view.kind === 'web') {
    return (
      <div className={styles.page}>
        <p className={styles.brand}>{view.brand}</p>
        <h2 className={styles.pageTitle}>{view.title}</h2>
        {view.subtitle && <p className={styles.pageSub}>{view.subtitle}</p>}

        {view.datos ? (
          <div className={styles.datos}>
            {view.datos.map((dato) => (
              <div key={dato.etiqueta} className={styles.dato}>
                <span className={styles.datoEtiqueta}>{dato.etiqueta}</span>
                <span className={styles.datoValor} data-signal={dato.senal}>
                  {dato.valor}
                </span>
              </div>
            ))}
            {view.button && <Accion view={view} />}
          </div>
        ) : (
          <div className={styles.form}>
            {view.fields.map((field) => (
              <label key={field.label} className={styles.field} data-signal={field.senal}>
                <span>{field.label}</span>
                <span className={styles.input}>
                  {field.valor === 'correo'
                    ? correo
                    : field.valor === 'usuario'
                      ? usuario
                      : field.placeholder}
                </span>
              </label>
            ))}
            <Accion view={view} />
          </div>
        )}

        {view.footer && <p className={styles.pageFooter}>{view.footer}</p>}
      </div>
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
