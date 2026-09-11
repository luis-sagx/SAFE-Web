import styles from './DeviceScreen.module.css'

// Notificación del teléfono al llegar a una escena; va en el nodo (no en la
// vista) porque dos nodos con la misma pantalla pueden diferir en si ya llegó.
// Ver docs/superpowers/specs/2026-09-03-notificaciones-codigo-telefono-design.md.
export interface Notificacion {
  app: string
  remitente: string
  /** Texto plano, nunca HTML: no hace falta una segunda vía de inyección al
   *  lado de `msgs[].text`. */
  texto: string
  hora?: string
  goto?: string
  label?: string
}

// Nombre accesible de los botones fijo y sin nombres propios: si saliera del
// contenido colisionaría con "Mensajes"/"Banco" en tests que buscan esos
// roles por nombre (AntifraudeBanco, BonoEstado, TarjetaBloqueada).
function NotificacionTelefono({
  notificacion,
  onDescartar,
}: {
  notificacion: Notificacion
  onDescartar: () => void
}) {
  const { app, remitente, texto, hora, goto, label } = notificacion

  return (
    <div className={styles.phoneNotificacion} role="status" aria-live="polite">
      {goto ? (
        <button
          type="button"
          className={styles.phoneNotificacionAbrir}
          aria-label="Abrir la notificación"
          data-hotspot-goto={goto}
          data-hotspot-label={label}
        >
          <p className={styles.phoneNotificacionCabecera}>
            <span className={styles.phoneNotificacionApp}>{app}</span>
            <span className={styles.phoneNotificacionRemitente}>{remitente}</span>
            {hora && <span className={styles.phoneNotificacionHora}>{hora}</span>}
          </p>
          <p className={styles.phoneNotificacionTexto}>{texto}</p>
        </button>
      ) : (
        <div className={styles.phoneNotificacionAbrir}>
          <p className={styles.phoneNotificacionCabecera}>
            <span className={styles.phoneNotificacionApp}>{app}</span>
            <span className={styles.phoneNotificacionRemitente}>{remitente}</span>
            {hora && <span className={styles.phoneNotificacionHora}>{hora}</span>}
          </p>
          <p className={styles.phoneNotificacionTexto}>{texto}</p>
        </div>
      )}
      <button
        type="button"
        className={styles.phoneNotificacionCerrar}
        aria-label="Descartar la notificación"
        data-control=""
        onClick={onDescartar}
      >
        ✕
      </button>
    </div>
  )
}

export default NotificacionTelefono
