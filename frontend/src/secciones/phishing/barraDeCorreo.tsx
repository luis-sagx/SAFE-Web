import { Forward, Reply, ShieldAlert, Trash2 } from 'lucide-react'
import type { ScreenNode } from '../../components/StoryEscenario'
import type { AccionCorreo } from '../../components/ui/DesktopChrome'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Naturaleza } from '../../data/catalogo'

// Los finales se generan por naturaleza (fraude/legítimo) en vez de escribirse
// ocho veces. En los legítimos eliminar/spam son el fallo: enseña que descartar todo no es criterio.
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
  // Ni acierto ni error (issue #34): el correo era real, no expuso nada, pero
  // lo que pedía sigue sin hacerse — de ahí 'partial'.
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

// `vista` es la pantalla donde se muestra el veredicto: se hereda del correo que lo provocó.
export function finalesDeBarra(
  naturaleza: Naturaleza,
  vista: ScreenView,
): Record<string, ScreenNode> {
  const finales = naturaleza === 'fraude' ? FRAUDE : LEGITIMO

  return Object.fromEntries(
    Object.entries(finales).map(([id, nodo]) => [id, { ...nodo, view: vista }]),
  )
}
