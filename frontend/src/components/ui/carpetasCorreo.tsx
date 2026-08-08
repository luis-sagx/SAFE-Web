import type { CarpetaCorreo } from './DesktopChrome'
import styles from './DeviceScreen.module.css'

/**
 * Las carpetas del cliente de correo y lo que hay dentro de cada una.
 *
 * Existe porque una acción de la barra tiene que **verse**: marcar como spam y
 * que el mensaje siga en Recibidos deja al participante sin saber si pasó algo.
 * El veredicto lo cuenta, pero el buzón es donde se comprueba.
 *
 * Estaba resuelto solo en el escenario interactivo. Al pasar los ocho al mismo
 * cliente de correo, tenía que dejar de vivir dentro de un escenario.
 */

/** Los datos del mensaje que se muestran en la carpeta de destino. */
export interface MensajeCorreo {
  nombre: string
  direccion: string
  asunto: string
}

/// A dónde va el correo según qué botón de la barra terminó el escenario, y si
/// eso lo saca de Recibidos. Archivar no tiene carpeta propia: solo desaparece
/// de la vista, como dice su final ("sigue en tu buzón" pero ya no a la vista).
const DESTINO_ACCION: Record<
  string,
  { carpeta?: 'Enviados' | 'Spam' | 'Papelera'; prefijo?: string; vaciaRecibidos: boolean }
> = {
  e_archivar: { vaciaRecibidos: true },
  e_eliminar: { carpeta: 'Papelera', vaciaRecibidos: true },
  e_spam: { carpeta: 'Spam', vaciaRecibidos: true },
  e_responder: { carpeta: 'Enviados', prefijo: 'Re:', vaciaRecibidos: false },
  e_reenviar: { carpeta: 'Enviados', prefijo: 'Fwd:', vaciaRecibidos: false },
}

/// Misma fila de remitente que la bandeja principal (avatar, nombre,
/// dirección): la lista de una carpeta con un mensaje suelto no debería verse
/// más pobre que el mensaje abierto.
function ResumenMensaje({ mensaje, prefijo }: { mensaje: MensajeCorreo; prefijo?: string }) {
  return (
    <div className={styles.senderRow}>
      <div className={styles.avatar} aria-hidden>
        {mensaje.nombre.slice(0, 1).toUpperCase()}
      </div>
      <div className={styles.senderId}>
        <p className={styles.senderName}>{mensaje.nombre}</p>
        <p className={styles.senderAddr}>{mensaje.direccion}</p>
        <p className={styles.mailFolderAsunto}>
          {prefijo ? `${prefijo} ${mensaje.asunto}` : mensaje.asunto}
        </p>
      </div>
    </div>
  )
}

/**
 * Las carpetas tal como quedan después de la acción tomada.
 *
 * `final` es el nodo en el que terminó la corrida, o `undefined` mientras siga
 * abierta. Navegar entre carpetas nunca es una decisión del escenario —mirar
 * otra bandeja no responde todavía a la amenaza— así que ninguna lleva
 * `data-hotspot-goto`.
 */
export function carpetasCorreo(mensaje: MensajeCorreo, final?: string): CarpetaCorreo[] {
  const destino = final ? DESTINO_ACCION[final] : undefined

  const carpetas: CarpetaCorreo[] = [
    {
      nombre: 'Enviados',
      vacia: 'No hay correos enviados.',
      contenido:
        destino?.carpeta === 'Enviados' ? (
          <ResumenMensaje mensaje={mensaje} prefijo={destino.prefijo} />
        ) : undefined,
    },
    {
      nombre: 'Spam',
      vacia: 'No hay correos marcados como spam.',
      contenido: destino?.carpeta === 'Spam' ? <ResumenMensaje mensaje={mensaje} /> : undefined,
    },
    {
      nombre: 'Papelera',
      vacia: 'La papelera está vacía.',
      contenido: destino?.carpeta === 'Papelera' ? <ResumenMensaje mensaje={mensaje} /> : undefined,
    },
  ]

  if (destino?.vaciaRecibidos) {
    carpetas.push({ nombre: 'Recibidos', vacia: 'No hay correos en la bandeja de entrada.' })
  }

  return carpetas
}
