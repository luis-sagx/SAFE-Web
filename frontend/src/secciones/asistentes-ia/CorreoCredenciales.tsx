import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { crearChatIA, conRespuestaIA } from './chatIA'

/**
 * El caso más directo de la sección: no hay un tercero de por medio, es tu
 * propio acceso. La tentación es que pegar el usuario y la clave "ahorra
 * pasos" — pero es la única de las cuatro donde lo compartido no es solo un
 * dato personal, sino la llave de un sistema.
 */

const HORA = '08:30'

const BORRADOR =
  'Redacta un correo de bienvenida para mi compañero nuevo y dile que su usuario es lejaramillo5 y su contraseña es 45664329.'

const CHAT = crearChatIA('Redactor de mensajes · servicio externo', BORRADOR, HORA)

const ENVIO_CON_CLAVE = conRespuestaIA(
  CHAT,
  HORA,
  BORRADOR,
  '¡Con gusto! Aquí tienes: "Bienvenido al equipo. Tu usuario es lejaramillo5 y tu contraseña es 45664329. Puedes cambiarla en tu primer ingreso."',
)
const ENVIO_SIN_CLAVE = conRespuestaIA(
  CHAT,
  HORA,
  'Redacta un correo de bienvenida para mi compañero nuevo, avisándole que su usuario y contraseña de acceso le llegarán por separado.',
  'Aquí tienes: "Bienvenido al equipo. En un mensaje aparte te compartiré tu usuario y tu contraseña de acceso."',
)
const ENVIO_SOLO_USUARIO = conRespuestaIA(
  CHAT,
  HORA,
  'Redacta un correo de bienvenida para mi compañero nuevo y dile que su usuario es lejaramillo5. Inventa un ejemplo de cómo se vería una contraseña temporal, sin que sea la real.',
  'Aquí tienes: "Bienvenido al equipo. Tu usuario es lejaramillo5. Tu contraseña temporal sigue un formato como Temporal-2026; el equipo de sistemas te confirmará la tuya."',
)

const STORY: Story<ScreenNode> = {
  n1: {
    kind: 'scene',
    view: CHAT,
    choices: [
      { label: 'Enviar el mensaje tal cual, para que la IA redacte el correo', goto: 'e_con_clave' },
      {
        label: 'Pedir que redacte el correo sin la contraseña, y enviársela después por otro canal',
        goto: 'e_sin_clave',
      },
      {
        label: 'Enviar el usuario real, pero pedirle a la IA que invente un ejemplo de contraseña',
        goto: 'e_solo_usuario',
      },
    ],
  },
  e_con_clave: {
    kind: 'bad',
    view: ENVIO_CON_CLAVE,
    senales: [
      {
        id: 'clave',
        targetId: 'borrador-enviado',
        pantalla: 'e_con_clave',
        texto:
          'Tu <b>usuario y tu contraseña</b> quedaron escritos en la conversación con un servicio externo. Cualquiera con acceso a ese historial —incluida la propia IA— puede usarlos.',
      },
    ],
    verdict: 'Credenciales de acceso compartidas con la IA',
    outcome:
      'Le diste tu usuario y tu contraseña reales a un servicio externo. Para redactar un correo de bienvenida, la IA no necesitaba conocer ninguno de los dos.',
  },
  e_sin_clave: {
    kind: 'good',
    view: ENVIO_SIN_CLAVE,
    senales: [
      {
        id: 'sin-clave',
        targetId: 'borrador-enviado',
        pantalla: 'e_sin_clave',
        texto: 'La IA redactó el correo sin conocer el usuario ni la contraseña reales.',
      },
    ],
    verdict: 'Correo redactado sin exponer el acceso',
    outcome:
      'La IA redactó el aviso sin conocer el usuario ni la contraseña. Los compartiste después, por un canal donde solo los ve tu compañero.',
  },
  e_solo_usuario: {
    kind: 'partial',
    view: ENVIO_SOLO_USUARIO,
    senales: [
      {
        id: 'usuario',
        targetId: 'borrador-enviado',
        pantalla: 'e_solo_usuario',
        texto: 'No se expuso la contraseña real, pero el usuario real sí quedó en la conversación.',
      },
    ],
    verdict: 'Solo protegiste la mitad del acceso',
    outcome:
      'No compartiste la contraseña real, pero sí el usuario. Con el usuario expuesto, a quien intente entrar solo le falta adivinar o probar la clave.',
  },
}

const SENALES: Senal[] = [
  {
    id: 'borrador',
    targetId: 'borrador',
    pantalla: 'n1',
    texto:
      'El mensaje ya trae un <b>usuario y una contraseña reales</b> escritos tal cual. Una IA puede redactar un correo de bienvenida sin necesitar esos datos.',
  },
]

const RULE =
  'Regla de oro: nunca escribas una <b>contraseña real</b> —ni la tuya ni la de nadie— en una conversación con una IA. Los accesos se comparten por un canal aparte, nunca dentro del texto que le pides que redacte.'

const RESUMEN = 'Le pides a una IA que redacte un correo con tu usuario y tu contraseña reales adentro.'

const CONTEXTO: Contexto = {
  antes: 'Un compañero nuevo empieza hoy y necesita entrar al sistema de inventario de la oficina.',
  ahora: (
    <>
      <strong>Le pides a la IA</strong> que te ayude a redactar el correo de bienvenida con los datos de
      acceso.
    </>
  ),
}

function CorreoCredenciales() {
  return (
    <StoryEscenario
      escenarioId="asistentes-ia/correo-credenciales"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule={RULE}
      accionesEnPantalla
      pregunta="¿Qué le pides a la IA?"
      cuandoTermina="Cuando decidas qué escribirle a la IA sobre el usuario y la contraseña."
      pista={
        <p>
          La contraseña de acceso no le hace falta a la IA para redactar un correo de bienvenida. Lo que
          decides es si se la das de todos modos.
        </p>
      }
    />
  )
}

export default CorreoCredenciales
