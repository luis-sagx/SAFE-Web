import type { EmailFolder } from './DesktopChrome'
import styles from './DeviceScreen.module.css'

// Una acción de la barra tiene que verse: marcar como spam y que el mensaje
// siga en Recibidos deja al participante sin saber si pasó algo.

export interface EmailMessage {
  nombre: string
  direccion: string
  asunto: string
}

const DESTINATION_ACTION: Record<
  string,
  { carpeta?: 'Enviados' | 'Spam' | 'Papelera'; prefijo?: string; vaciaRecibidos: boolean }
> = {
  e_eliminar: { carpeta: 'Papelera', vaciaRecibidos: true },
  e_spam: { carpeta: 'Spam', vaciaRecibidos: true },
  e_responder: { carpeta: 'Enviados', prefijo: 'Re:', vaciaRecibidos: false },
  e_reenviar: { carpeta: 'Enviados', prefijo: 'Fwd:', vaciaRecibidos: false },
}

function MessageSummary({ mensaje: message, prefijo: prefix }: { mensaje: EmailMessage; prefijo?: string }) {
  return (
    <div className={styles.senderRow}>
      <div className={styles.avatar} aria-hidden>
        {message.nombre.slice(0, 1).toUpperCase()}
      </div>
      <div className={styles.senderId}>
        <p className={styles.senderName}>{message.nombre}</p>
        <p className={styles.senderAddr}>{message.direccion}</p>
        <p className={styles.mailFolderAsunto}>
          {prefix ? `${prefix} ${message.asunto}` : message.asunto}
        </p>
      </div>
    </div>
  )
}

// `final` es el nodo donde terminó la corrida (undefined si sigue abierta).
// Navegar entre carpetas no es una decisión del escenario, así que ninguna
// lleva data-hotspot-goto.
export function createEmailFolders(message: EmailMessage, final?: string): EmailFolder[] {
  const destination = final ? DESTINATION_ACTION[final] : undefined

  const folders: EmailFolder[] = [
    {
      nombre: 'Enviados',
      vacia: 'No hay correos enviados.',
      contenido:
        destination?.carpeta === 'Enviados' ? (
          <MessageSummary mensaje={message} prefijo={destination.prefijo} />
        ) : undefined,
    },
    {
      nombre: 'Spam',
      vacia: 'No hay correos marcados como spam.',
      contenido: destination?.carpeta === 'Spam' ? <MessageSummary mensaje={message} /> : undefined,
    },
    {
      nombre: 'Papelera',
      vacia: 'La papelera está vacía.',
      contenido: destination?.carpeta === 'Papelera' ? <MessageSummary mensaje={message} /> : undefined,
    },
  ]

  if (destination?.vaciaRecibidos) {
    folders.push({ nombre: 'Recibidos', vacia: 'No hay correos en la bandeja de entrada.' })
  }

  return folders
}
