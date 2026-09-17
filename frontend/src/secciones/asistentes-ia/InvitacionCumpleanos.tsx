import { Palette, Paperclip, PartyPopper, UserRound, UsersRound } from 'lucide-react'
import type { ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import AIChatScenario from './EscenarioChatIA'
import PhotoGallery, { type GalleryPhoto } from './GaleriaFotos'
import { createAIChat, withFreeTextComposer, signal } from './chatIA'

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

function onSendStep1(_texto: string, adjuntos: string[]): { goto: string; label?: string } {
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
  'La <b>foto de Sofía</b>: su cara de frente, el uniforme y el escudo de la escuela. Tú puedes decidir por ella, pero ella no puede aceptar, y la foto queda en los servidores de otra empresa, que puede guardarla o usarla para entrenar su IA.'

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  e_grupo: {
    kind: 'bad',
    view: CHAT,
    senales: [
      signal(
        'foto-grupo',
        'e_grupo',
        'La <b>foto del aula</b>: las caras de 12 niños que no son tus hijos. Sus papás nunca dieron permiso para que sus fotos terminen en una IA externa, y tú no puedes darlo por ellos.',
      ),
      signal('foto-hija', 'e_grupo', FACE_OF_DAUGHTER),
    ],
    verdict: 'Subiste caras de niños sin permiso de sus papás',
    outcome:
      'La foto del aula muestra a 12 compañeros de Sofía. Esa decisión no era tuya: cada familia decide sobre la imagen de su hijo. Para una invitación bastaba con el dibujo o la decoración.',
  },
  e_foto_hija: {
    kind: 'bad',
    view: CHAT,
    senales: [signal('foto-hija', 'e_foto_hija', FACE_OF_DAUGHTER)],
    verdict: 'Subiste la cara de tu hija a un servicio externo',
    outcome:
      'Era tu hija y la decisión era tuya, pero la foto muestra su cara, su uniforme y su escuela: suficiente para reconocerla y saber dónde encontrarla. Una invitación no necesitaba nada de eso.',
  },
  e_sin_caras: {
    kind: 'good',
    view: CHAT,
    // El mensaje enviado puede ir sin texto: la señal apunta a las imágenes, que sí están.
    senales: [
      signal('dibujo', 'e_sin_caras', 'El <b>dibujo de Sofía</b> no muestra a nadie: la invitación queda personal sin que su cara salga de tu computador.'),
      signal('decoracion', 'e_sin_caras', 'La <b>decoración</b> tampoco muestra personas. Con eso la IA armó la invitación igual.'),
    ],
    verdict: 'Armaste la invitación sin subir ninguna cara',
    outcome:
      'No subiste las fotos de Sofía ni de su aula. Para una invitación bastaban el dibujo y la decoración: ninguna cara salió de tu computador.',
  },
}

const SIGNALS = [
  signal(
    'imagenes-pedidas',
    'n1',
    'La IA pide <b>imágenes para la invitación</b>, no caras. En tu galería hay un dibujo y la decoración, que no muestran a nadie.',
  ),
]

const RULE =
  'Regla de oro: la cara de un menor no se sube a una IA externa: no puede dar su permiso, y la foto queda en servidores ajenos. Si en la foto salen otros niños, la decisión ni siquiera es tuya. Un dibujo o una descripción casi siempre bastan.'

const SUMMARY = 'Le pides a una IA la invitación del cumpleaños de tu hija, con fotos de ella y de su aula en la galería.'

const CONTEXT: Context = {
  antes: `Es de noche y estás organizando el cumpleaños de tu hija ${DAUGHTER}. Viste que las IA convierten fotos en caricaturas.`,
  ahora: (
    <>
      <strong>Abres el asistente de IA</strong> en el computador. Al lado tienes la galería con las fotos
      que pasaste del celular.
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
          Arrastra al chat las imágenes que usarías, o toca el clip{' '}
          <Paperclip aria-label="clip" className="inline size-5 align-text-bottom" strokeWidth={2} /> para
          adjuntarlas todas y descarta con la X las que no quieras. Luego toca "Enviar".
        </p>
      }
    />
  )
}

export default BirthdayInvitation
