import type { CarpetaCorreo } from './DesktopChrome'
import styles from './DeviceScreen.module.css'

// Una acción de la barra tiene que verse: marcar como spam y que el mensaje
// siga en Recibidos deja al participante sin saber si pasó algo.

export interface MensajeCorreo {
  nombre: string
  direccion: string
  asunto: string
}

const DESTINO_ACCION: Record<
  string,
  { carpeta?: 'Enviados' | 'Spam' | 'Papelera'; prefijo?: string; vaciaRecibidos: boolean }
> = {
  e_eliminar: { carpeta: 'Papelera', vaciaRecibidos: true },
  e_spam: { carpeta: 'Spam', vaciaRecibidos: true },
  e_responder: { carpeta: 'Enviados', prefijo: 'Re:', vaciaRecibidos: false },
  e_reenviar: { carpeta: 'Enviados', prefijo: 'Fwd:', vaciaRecibidos: false },
}

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

// `final` es el nodo donde terminó la corrida (undefined si sigue abierta).
// Navegar entre carpetas no es una decisión del escenario, así que ninguna
// lleva data-hotspot-goto.
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
