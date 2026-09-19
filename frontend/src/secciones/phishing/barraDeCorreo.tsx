import { Forward, Reply, ShieldAlert, Trash2 } from 'lucide-react'
import type { ScreenNode } from '../../components/StoryEscenario'
import type { EmailAction } from '../../components/ui/DesktopChrome'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Nature } from '../../data/catalogo'

// Los finales se generan por naturaleza (fraude/legítimo) en vez de escribirse
// ocho veces. En los legítimos eliminar/spam son el fallo: enseña que descartar todo no es criterio.
export const ACTIONS_BAR: EmailAction[] = [
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

// Redacción compacta (issue de UX): dos frases cortas como mucho, lo esencial
// primero. Un solo lugar arregla el cierre de los ocho escenarios de phishing.
const FRAUD = {
  e_spam: {
    kind: 'good' as const,
    verdict: 'No caíste · lo reportaste',
    outcome: 'Es la mejor reacción posible: no caíste, y tu proveedor aprende a filtrar ese remitente.',
  },
  e_eliminar: {
    kind: 'good' as const,
    verdict: 'No caíste · lo eliminaste',
    outcome:
      'Borrarlo sin tocar nada ya es no caer. Marcarlo como spam habría hecho algo más: avisar al filtro.',
  },
  e_responder: {
    kind: 'partial' as const,
    verdict: 'No entregaste nada, pero contestaste',
    outcome:
      'No diste tus datos, pero confirmaste que tu dirección existe y alguien la lee. Ahora tiene una conversación abierta contigo.',
  },
  e_reenviar: {
    kind: 'partial' as const,
    verdict: 'No caíste tú, pero lo pasaste',
    outcome:
      'No caíste, pero el mensaje llegó a alguien que quizá confíe más. Para pedir opinión, mejor una captura.',
  },
}

const LEGITIMATE = {
  e_spam: {
    kind: 'bad' as const,
    verdict: 'Descartaste un mensaje real',
    outcome: 'El correo era auténtico. Marcarlo como spam le enseña al filtro a esconder los siguientes.',
  },
  e_eliminar: {
    kind: 'bad' as const,
    verdict: 'Descartaste un mensaje real',
    outcome:
      'El correo era auténtico y lo borraste. Te quedaste sin el aviso, y sin lo que había que hacer con él.',
  },
  // Ni acierto ni error (issue #34): el correo era real, no expuso nada, pero
  // lo que pedía sigue sin hacerse, de ahí 'partial'.
  e_responder: {
    kind: 'partial' as const,
    verdict: 'Sin daño, pero sin resolver',
    outcome: 'El remitente era real: tu respuesta no fue a un atacante. Lo que el mensaje pedía sigue pendiente.',
  },
  e_reenviar: {
    kind: 'partial' as const,
    verdict: 'Lo pasaste, pero sigue pendiente',
    outcome:
      'El mensaje era auténtico, reenviarlo no puso a nadie en riesgo. Pero lo que pedía sigue sin hacerse.',
  },
}

// `vista` es la pantalla donde se muestra el veredicto: se hereda del correo que lo provocó.
export function createToolbarEndings(
  nature: Nature,
  toView: ScreenView,
): Record<string, ScreenNode> {
  const endings = nature === 'fraude' ? FRAUD : LEGITIMATE

  return Object.fromEntries(
    Object.entries(endings).map(([id, node]) => [id, { ...node, view: toView }]),
  )
}
