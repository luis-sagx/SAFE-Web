import { Forward, Reply, ShieldAlert, Trash2 } from 'lucide-react'
import type { ScreenNode } from '../../components/StoryEscenario'
import type { AccionCorreo } from '../../components/ui/DesktopChrome'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Naturaleza } from '../../data/catalogo'

/**
 * La barra del cliente de correo, con sus cuatro finales, para cualquier
 * escenario de phishing.
 *
 * Responder, reenviar, eliminar y marcar como spam significan lo mismo en
 * todos los correos; lo único que cambia es **si el mensaje era real**. Por
 * eso los finales se generan a partir de la naturaleza del escenario en vez
 * de escribirse ocho veces: siete copias del mismo texto acabarían divergiendo,
 * igual que había pasado con la ventana.
 *
 * Y la inversión es justo lo que hace que valga la pena tenerlos en los
 * legítimos: ahí **eliminar y marcar como spam son un fallo**. Un módulo donde
 * borrar siempre acierta enseña "desconfía de todo", que no es criterio sino
 * otra forma de equivocarse — y le cuesta a la persona el aviso que sí
 * necesitaba leer.
 */
export const ACCIONES_BARRA: AccionCorreo[] = [
  {
    Icono: Reply,
    etiqueta: 'Responder',
    titulo: 'Responder',
    goto: 'e_responder',
    label: 'Respondió el correo',
  },
  {
    Icono: Forward,
    etiqueta: 'Reenviar',
    titulo: 'Reenviar',
    goto: 'e_reenviar',
    label: 'Reenvió el correo a otra persona',
  },
  {
    Icono: Trash2,
    etiqueta: 'Eliminar',
    titulo: 'Eliminar',
    goto: 'e_eliminar',
    label: 'Eliminó el correo',
  },
  {
    Icono: ShieldAlert,
    etiqueta: 'Spam',
    titulo: 'Marcar como spam',
    goto: 'e_spam',
    label: 'Marcó el correo como spam',
  },
]

const FRAUDE = {
  e_spam: {
    kind: 'good' as const,
    verdict: 'No caíste · lo reportaste',
    outcome:
      'Es la mejor reacción posible: no caíste y además tu proveedor de correo aprende a filtrar ese remitente, así que el mismo mensaje le llega a menos gente.',
  },
  e_eliminar: {
    kind: 'good' as const,
    verdict: 'No caíste · lo eliminaste',
    outcome:
      'Lo borraste sin tocar nada, que es suficiente para no caer. Marcarlo como spam habría hecho algo más: avisar al filtro para que no le llegue a otros.',
  },
  e_responder: {
    kind: 'partial' as const,
    verdict: 'No entregaste nada, pero contestaste',
    outcome:
      'No diste tus datos, pero confirmaste que tu dirección existe y que alguien la lee. Es justo lo que un atacante busca para insistir con algo mejor preparado, y ahora tiene una conversación abierta contigo.',
  },
  e_reenviar: {
    kind: 'partial' as const,
    verdict: 'No caíste tú, pero lo pasaste',
    outcome:
      'Se lo reenviaste a otra persona para que opine. Tú no caíste, pero pusiste el mensaje (con todo lo que trae) en la bandeja de alguien que quizá no lo mire con la misma desconfianza. Para consultar una duda es mejor una captura.',
  },
}

const LEGITIMO = {
  e_spam: {
    kind: 'bad' as const,
    verdict: 'Descartaste un mensaje real',
    outcome:
      'El correo era auténtico. Marcarlo como spam no solo te lo quita de en medio: le enseña al filtro a esconder los siguientes del mismo remitente, y esos sí los vas a necesitar.',
  },
  e_eliminar: {
    kind: 'bad' as const,
    verdict: 'Descartaste un mensaje real',
    outcome:
      'El correo era auténtico y lo borraste. Desconfiar de todo sale tan caro como confiar de más: te quedaste sin el aviso y sin lo que había que hacer con él.',
  },
  // Ni acierto ni error: el correo era real, así que contestarlo no expuso
  // nada, y el resultado no debe leerse como un reproche (issue #34). Lo que
  // falta es lo otro: el mensaje pedía algo y sigue sin hacerse. Ese "sin daño
  // y sin resolver" es exactamente lo que significa 'partial' aquí, el mismo
  // caso que archivarlo.
  e_responder: {
    kind: 'partial' as const,
    verdict: 'Sin daño, pero sin resolver',
    outcome:
      'El remitente era quien decía ser, así que tu respuesta no fue a parar a ningún atacante. Probablemente no llegó a nadie: los avisos de este tipo salen casi siempre de una dirección que no lee respuestas. Lo que sigue pendiente es lo que el mensaje te pedía a ti.',
  },
  e_reenviar: {
    kind: 'partial' as const,
    verdict: 'Lo pasaste, pero sigue pendiente',
    outcome:
      'El mensaje era auténtico, así que reenviarlo no puso a nadie en riesgo. Pero pedir una opinión no es lo mismo que actuar, y lo que el correo te pedía a ti sigue sin hacerse.',
  },
}

/**
 * Los cuatro finales listos para meter en el grafo de un escenario.
 *
 * `vista` es la pantalla sobre la que se leen: el panel de resultado se muestra
 * al lado del correo que lo provocó, así que los finales heredan la misma
 * imagen del mensaje.
 */
export function finalesDeBarra(
  naturaleza: Naturaleza,
  vista: ScreenView,
): Record<string, ScreenNode> {
  const finales = naturaleza === 'fraude' ? FRAUDE : LEGITIMO

  return Object.fromEntries(
    Object.entries(finales).map(([id, nodo]) => [id, { ...nodo, view: vista }]),
  )
}
