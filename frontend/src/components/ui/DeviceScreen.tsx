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

/** Barra de título de ventana de escritorio: el nombre de la app o pestaña
 *  activa. Sin botones de ventana a propósito: unos puntos de colores se leen
 *  como macOS y una franja ─ □ ✕ se lee como Windows; sin ninguno de los dos,
 *  el marco sigue leyéndose como "una ventana" para cualquiera, sea cual sea
 *  el sistema que use. */
function Titlebar({ texto }: { texto: string }) {
  return (
    <div className={styles.titlebar}>
      <span className={styles.titlebarText}>{texto}</span>
    </div>
  )
}

/** Franja de tareas al pie de la ventana: la señal más reconocible de "esto es
 *  un computador", ausente en cualquier app de celular. Puramente decorativa,
 *  por eso va oculta a lectores de pantalla. */
function Taskbar() {
  return (
    <div className={styles.taskbar} aria-hidden>
      <span className={styles.taskbarStart}>▦</span>
      <span className={styles.taskbarClock}>10:41</span>
    </div>
  )
}

function DeviceScreen({ view }: { view: ScreenView }) {
  if (view.kind === 'mail') {
    return (
      <section className={`${styles.screen} ${styles.desktop}`} aria-label="Bandeja de correo">
        <Titlebar texto="Correo — Recibidos" />

        <div className={styles.desktopBody}>
          {/* Carpetas fijas, no interactivas: solo dan el aspecto de cliente
              de escritorio. Un celular muestra esto en un menú, no siempre
              visible al lado. */}
          <nav className={styles.mailNav} aria-hidden>
            <span className={`${styles.mailNavItem} ${styles.mailNavActive}`}>📥 Recibidos</span>
            <span className={styles.mailNavItem}>📤 Enviados</span>
            <span className={styles.mailNavItem}>🗑 Papelera</span>
          </nav>

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
        </div>

        <Taskbar />
      </section>
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
