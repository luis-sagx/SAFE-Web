import { Palette, Paperclip, PartyPopper, UserRound, UsersRound } from 'lucide-react'
import type { ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import AIChatScenario from './EscenarioChatIA'
import PhotoGallery, { type GalleryPhoto } from './GaleriaFotos'
import { createAIChat, withFreeTextComposer, mentionsAny, signal, type SendResult } from './chatIA'

/** Reemplaza a "Responder a un cliente con su historial" (issue #213). El escenarioId sigue siendo
 *  `historial-cliente`: es la clave con la que están guardadas las corridas.
 *
 *  Una mamá arma con una IA la invitación del cumpleaños de su hija. Nunca hay una foto real: la galería
 *  son tarjetas que describen cada imagen, y se arrastran al chat (o se adjuntan con el clip).
 *
 *  Dos casos de aprobación: la foto de tu hija la puedes decidir tú, pero ella no puede aceptar y su cara,
 *  su uniforme y su escuela quedan en un servicio externo. La foto del aula trae a otros niños cuyos
 *  papás nunca dieron permiso. Las dos son fallo. Adjuntar solo el dibujo o la decoración es el acierto. */

const TIME = '20:12'
const DAUGHTER = 'Sofía'

const PHOTOS: GalleryPhoto[] = [
  { id: 'foto-hija', nombre: 'sofia_uniforme.jpg', detalle: 'Sofía sonriendo de frente, con el uniforme y el escudo de su escuela', Icono: UserRound },
  { id: 'foto-grupo', nombre: 'aula_3B_grupo.jpg', detalle: 'Sofía y 12 compañeros de clase en el patio', Icono: UsersRound },
  { id: 'dibujo', nombre: 'dibujo_sofia.png', detalle: 'Un dinosaurio verde que pintó Sofía', Icono: Palette },
  { id: 'decoracion', nombre: 'decoracion_fiesta.jpg', detalle: 'Globos y la torta de dinosaurios, sin personas', Icono: PartyPopper },
]

// Sin imágenes, el texto tiene que describir la invitación; si no, la IA no tiene con qué armarla.
const DESCRIPTION_ROOTS = ['dinosaur', 'invitac', 'fiesta', 'torta', 'pastel', 'globo', 'tema', 'color', 'dibuj', 'decora', 'caricatur', 'fecha', 'hora', 'lugar', 'sabado', 'domingo', 'cumple', 'estilo', 'fondo', 'animal', 'celebr']

function onSendStep1(texto: string, adjuntos: string[]): SendResult {
  if (adjuntos.length === 0 && !mentionsAny(texto, DESCRIPTION_ROOTS)) {
    return { repregunta: 'Para armar la invitación necesito algo con qué trabajar: súbeme una imagen o cuéntame cómo la quieres.' }
  }
  const label = `Adjuntó: ${adjuntos.join(', ') || 'ninguna imagen'}`
  if (adjuntos.includes('foto-grupo')) return { goto: 'e_grupo', label }
  if (adjuntos.includes('foto-hija')) return { goto: 'e_foto_hija', label }
  return { goto: 'e_sin_caras', label }
}

const OPENING = [
  { texto: `Hola, quiero hacer la invitación para el cumpleaños de mi hija ${DAUGHTER}, cumple 7.`, mio: true as const },
  {
    texto:
      '¡Qué lindo! Súbeme las imágenes que quieras usar y te preparo una invitación estilo caricatura, lista para compartir.',
  },
]

const SITE = { titulo: 'Asistente IA', url: 'https://chat.asistente-ia.com/nuevo' }
const SUB = 'Creador de imágenes · servicio externo'

const CHAT = withFreeTextComposer(createAIChat(SUB, OPENING, TIME, [], SITE), {
  placeholder: 'Arrastra aquí una imagen o escribe lo que le pedirías a la IA…',
  hora: TIME,
  respuestaIA: '¡Listo! Aquí tienes la invitación con las imágenes que me enviaste.',
  onEnviar: onSendStep1,
  archivos: PHOTOS,
})

const FACE_OF_DAUGHTER =
  '<b>La foto de Sofía muestra su cara, uniforme y escuela</b>. Ella no puede aceptar que quede en servidores de otra empresa.'

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  e_grupo: {
    kind: 'bad',
    view: CHAT,
    senales: [
      signal(
        'foto-grupo',
        'e_grupo',
        '<b>La foto del aula muestra a 12 niños</b> que no son tus hijos. Sus papás nunca dieron permiso, y tú no puedes darlo por ellos.',
      ),
      signal('foto-hija', 'e_grupo', FACE_OF_DAUGHTER),
    ],
    verdict: 'Subiste caras de niños sin permiso de sus papás',
    outcome:
      'La foto muestra a 12 compañeros. No puedes decidir por sus familias. Usa el dibujo o la decoración.',
  },
  e_foto_hija: {
    kind: 'bad',
    view: CHAT,
    senales: [signal('foto-hija', 'e_foto_hija', FACE_OF_DAUGHTER)],
    verdict: 'Subiste la cara de tu hija a un servicio externo',
    outcome:
      'La foto permite reconocer y ubicar a tu hija. La invitación no necesita mostrarla.',
  },
  e_sin_caras: {
    kind: 'good',
    view: CHAT,
    // El mensaje enviado puede ir sin texto: la señal apunta a las imágenes, que sí están.
    senales: [
      signal('dibujo', 'e_sin_caras', '<b>El dibujo de Sofía no muestra a nadie</b>. La invitación queda personal sin que su cara salga del computador.'),
      signal('decoracion', 'e_sin_caras', '<b>La decoración tampoco muestra personas</b>. Con eso bastó para armar la invitación.'),
    ],
    verdict: 'Armaste la invitación sin subir ninguna cara',
    outcome:
      'Usaste el dibujo y la decoración. No compartiste fotos de niños.',
  },
}

const SIGNALS = [
  signal(
    'imagenes-pedidas',
    'n1',
    '<b>La IA pide imágenes, no caras</b>. El dibujo y la decoración no muestran a nadie.',
  ),
]

const RULE =
  '<b>Tu hija no puede dar permiso para subir su foto a una IA externa</b>. Si aparecen otros niños, la decisión es de sus familias.'

const SUMMARY = 'Pides a una IA crear una invitación para tu hija con imágenes de la galería.'

export const CONTEXT: Context = {
  antes: `Organizas el cumpleaños de tu hija ${DAUGHTER} y quieres una invitación hecha con IA.`,
  ahora: (
    <>
      <strong>Abres el asistente de IA</strong>. Al lado está la galería de imágenes de tu celular.
    </>
  ),
}

function BirthdayInvitation() {
  return (
    <AIChatScenario
      escenarioId="asistentes-ia/historial-cliente"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      senales={SIGNALS}
      rule={RULE}
      documentoFuente={<PhotoGallery fotos={PHOTOS} />}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Arrastra al chat las imágenes que usarías o toca el clip{' '}
          <Paperclip aria-label="clip" className="inline size-5 align-text-bottom" strokeWidth={2} />
          para adjuntarlas. Quita las que no quieras con la X y toca "Enviar".
        </p>
      }
    />
  )
}

export default BirthdayInvitation
