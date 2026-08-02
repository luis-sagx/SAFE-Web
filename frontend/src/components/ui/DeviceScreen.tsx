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
      to: string
      subject: string
      date: string
      /** HTML fijo del escenario, nunca contenido de un usuario. */
      body: string
      attachment?: string
      /** Etiqueta del cliente de correo: "Promociones", "Externo"… */
      label?: string
    }
  | {
      kind: 'web'
      url: string
      /** Candado del navegador. Falso pinta la advertencia "No seguro". */
      secure: boolean
      brand: string
      title: string
      subtitle?: string
      fields: { label: string; placeholder: string }[]
      button: string
      footer?: string
    }
  | {
      kind: 'sms'
      sender: string
      sub: string
      msgs: { text: string; time: string; mine?: boolean }[]
    }

function DeviceScreen({ view }: { view: ScreenView }) {
  if (view.kind === 'mail') {
    return (
      <section className={`${styles.screen} ${styles.mail}`} aria-label="Bandeja de correo">
        <div className={styles.mailbar}>
          <span className={styles.mailapp}>Correo</span>
          <span className={styles.mailbox}>Recibidos</span>
        </div>

        <div className={styles.mailbody}>
          <h1 className={styles.subject}>{view.subject}</h1>

          <div className={styles.senderRow}>
            <div className={styles.avatar} aria-hidden>
              {view.from.slice(0, 1).toUpperCase()}
            </div>
            <div className={styles.senderId}>
              <p className={styles.senderName}>
                {view.from}
                {view.label && <span className={styles.label}>{view.label}</span>}
              </p>
              <p className={styles.senderAddr}>{view.address}</p>
              <p className={styles.senderTo}>para {view.to}</p>
            </div>
            <span className={styles.date}>{view.date}</span>
          </div>

          <div
            className={styles.prose}
            // Contenido fijo del escenario: permite negritas y el enlace falso.
            dangerouslySetInnerHTML={{ __html: view.body }}
          />

          {view.attachment && (
            <div className={styles.attachment}>
              <span aria-hidden>📎</span>
              {view.attachment}
            </div>
          )}
        </div>
      </section>
    )
  }

  if (view.kind === 'web') {
    return (
      <section className={`${styles.screen} ${styles.web}`} aria-label="Página web simulada">
        <div className={styles.urlbar}>
          <span className={view.secure ? styles.lock : styles.warn}>
            {view.secure ? '🔒' : '⚠ No seguro'}
          </span>
          <span className={styles.url}>{view.url}</span>
        </div>

        <div className={styles.page}>
          <p className={styles.brand}>{view.brand}</p>
          <h2 className={styles.pageTitle}>{view.title}</h2>
          {view.subtitle && <p className={styles.pageSub}>{view.subtitle}</p>}

          <div className={styles.form}>
            {view.fields.map((field) => (
              <label key={field.label} className={styles.field}>
                <span>{field.label}</span>
                <span className={styles.input}>{field.placeholder}</span>
              </label>
            ))}
            <div className={styles.submit}>{view.button}</div>
          </div>

          {view.footer && <p className={styles.pageFooter}>{view.footer}</p>}
        </div>
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
