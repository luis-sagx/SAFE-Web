import styles from './DeviceScreen.module.css'

/**
 * Lo que el teléfono anuncia al llegar a una escena. Ver
 * docs/superpowers/specs/2026-09-03-notificaciones-codigo-telefono-design.md.
 *
 * En el fraude real el atacante no falsifica el código: lo provoca, y el banco
 * lo manda de verdad. Un escenario donde el código hay que ir a buscarlo se
 * pierde esa mitad de la lección. Va en el nodo y no en la vista porque una
 * notificación no es contenido de una pantalla: es algo que pasa en un momento
 * del guion, y dos nodos que enseñan la misma pantalla pueden diferir en si el
 * mensaje ya llegó (ver ScreenNode en StoryEscenario).
 */
export interface Notificacion {
  /** App que la emite: "Mensajes". */
  app: string
  /** El remitente del SMS, tal cual: "BANCO LITORAL", "+593 99 412 8867". Es
   *  la primera señal de un mensaje y aquí es lo primero que se lee. */
  remitente: string
  /** La vista previa. Texto plano, nunca HTML: un banner no lleva negritas, y
   *  no hace falta una segunda vía de inyección al lado de `msgs[].text`. El
   *  CSS la recorta a dos líneas, como recorta un banner de verdad; el lector
   *  de pantalla sigue leyendo el texto entero. */
  texto: string
  hora?: string
  /** Nodo al que lleva tocarla. Sin esto la notificación es solo aviso: se ve
   *  y no se abre, que es lo que hace un banner de una app que no está
   *  simulada. */
  goto?: string
  /** Se guarda en la traza de la corrida junto con `goto`. */
  label?: string
}

/**
 * El nombre accesible de los dos botones es fijo y sin nombres propios dentro
 * a propósito: si saliera del contenido —que empieza por la app, "Mensajes"—
 * colisionaría con el icono homónimo del dock (`AntifraudeBanco.test.tsx`,
 * `BonoEstado.test.tsx` hacen `getByRole('button', { name: /Mensajes/ })`
 * estando exactamente en el nodo del banner), y con el remitente pasaría lo
 * mismo con `/Banco/` en `TarjetaBloqueada.test.tsx`. Lo que el banner dice se
 * anuncia igual por el `aria-live` del contenedor.
 */
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
