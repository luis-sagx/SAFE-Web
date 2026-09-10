import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { IDENTIDAD_FICTICIA } from '../../lib/identidadFicticia'
import { crearChatIA, conRespuestaIA, marcar } from './chatIA'

/**
 * El caso más directo de la sección: no hay un tercero de por medio, es tu
 * propio acceso. Y es el único donde lo compartido no es un dato personal sino
 * la llave de un sistema — con el agravante de que la IA la repite de vuelta,
 * así que la contraseña termina escrita dos veces en una conversación que no
 * es tuya.
 *
 * El escenarioId sigue siendo `correo-credenciales` aunque ya no haya correo:
 * es la clave con la que están guardadas las corridas y no puede cambiar.
 */

const HORA = '08:30'

const CLAVE = IDENTIDAD_FICTICIA.clave
const PATRON = 'mi apellido y el año'

const REQUISITO = 'Pide 12 caracteres con número y símbolo.'
const PROMPT_CON_CLAVE = `${REQUISITO} Mi clave de ahora es ${CLAVE}, hazme una parecida para no olvidarme.`
const PROMPT_CON_PATRON = `${REQUISITO} Mi clave de ahora es ${PATRON}, hazme una con el mismo patrón pero más larga.`
const PROMPT_SIN_NADA = `${REQUISITO} Dame tres ejemplos que sean fáciles de recordar y difíciles de adivinar.`

// Este chat va en el computador y no en el celular: la clave del sistema de la
// oficina se cambia frente al equipo de trabajo, y en la barra de direcciones
// se ve además de quién es el sitio al que le estás escribiendo.
const CHAT = crearChatIA(
  'Asistente de escritura · servicio externo',
  [
    { texto: 'Hola, necesito una contraseña nueva para el sistema del trabajo.', mio: true },
    {
      texto:
        'Con gusto puedo ayudarte. Para proponerte una contraseña adecuada, indícame qué requisitos exige el sistema: la longitud mínima y si pide mayúsculas, números o símbolos.',
    },
  ],
  HORA,
  [
    { texto: PROMPT_CON_CLAVE, goto: 'e_con_clave' },
    { texto: PROMPT_CON_PATRON, goto: 'e_con_patron' },
    { texto: PROMPT_SIN_NADA, goto: 'e_sin_datos' },
  ],
  { titulo: 'Asistente IA', url: 'https://chat.asistente-ia.com/nuevo' },
)

const ENVIO_CON_CLAVE = conRespuestaIA(
  CHAT,
  HORA,
  marcar(PROMPT_CON_CLAVE, { 'clave-escrita': CLAVE }),
  marcar(
    `Entendido. Partiendo de la estructura de ${CLAVE}, le propongo tres variantes que cumplen los requisitos: «${CLAVE}!», «Clave-De-Practica-26#» y «ClaveDePractica2026$». Las tres conservan su formato original, de modo que le resultará sencillo recordarlas.`,
    { 'clave-repetida': `${CLAVE}!` },
  ),
)
const ENVIO_CON_PATRON = conRespuestaIA(
  CHAT,
  HORA,
  marcar(PROMPT_CON_PATRON, { 'patron-escrito': PATRON }),
  'Entendido. Manteniendo la estructura de apellido y año, le propongo: «Apellido-2026-Bodega!», «Apellido.2026.Inventario#» y «Apellido_2026_Central$». Le advierto, eso sí, que la combinación de apellido y año es de las primeras que prueba quien intenta adivinar una contraseña.',
)
const ENVIO_SIN_DATOS = conRespuestaIA(
  CHAT,
  HORA,
  PROMPT_SIN_NADA,
  'Con gusto. Aquí tiene tres opciones de más de doce caracteres, sin relación con datos personales: «Mango-Verde-41!», «Tren-Azul-Lunes#» y «Cinco-Gatos-Grises$». Le recomiendo cambiar una letra o un número de la que elija, para que sea únicamente suya.',
)

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  e_con_clave: {
    kind: 'bad',
    view: ENVIO_CON_CLAVE,
    senales: [
      {
        id: 'clave-escrita',
        targetId: 'clave-escrita',
        pantalla: 'e_con_clave',
        texto:
          'Tu <b>contraseña real</b>, escrita entera. Es la que todavía abre el sistema de inventario ahora mismo, mientras no la cambies.',
      },
      {
        id: 'clave-repetida',
        targetId: 'clave-repetida',
        pantalla: 'e_con_clave',
        texto:
          'Y la IA la repitió de vuelta. Ya no está escrita una vez sino dos, en un historial que se guarda en el servidor de otra empresa.',
      },
    ],
    verdict: 'Tu contraseña real quedó escrita en la IA',
    outcome:
      'Le entregaste tu contraseña actual a un servicio externo. Para proponerte una nueva, la IA solo necesitaba saber cuántos caracteres pide el sistema — nunca cuál era la anterior.',
  },
  e_con_patron: {
    kind: 'partial',
    view: ENVIO_CON_PATRON,
    senales: [
      {
        id: 'patron-escrito',
        targetId: 'patron-escrito',
        pantalla: 'e_con_patron',
        texto:
          'No es la contraseña, pero es <b>la receta con la que la armas</b>. Tu apellido está en tu correo y el año lo sabe cualquiera: con eso, adivinarla deja de ser azar y pasa a ser una lista corta.',
      },
    ],
    verdict: 'Diste el patrón, no la contraseña',
    outcome:
      'No escribiste tu clave, pero sí la fórmula con la que la construyes — y es la misma que probablemente usas en otras cuentas. Un patrón contado es una contraseña a medio entregar.',
  },
  e_sin_datos: {
    kind: 'good',
    view: ENVIO_SIN_DATOS,
    senales: [
      {
        id: 'borrador-enviado',
        targetId: 'borrador-enviado',
        pantalla: 'e_sin_datos',
        texto:
          'Le diste a la IA solo los requisitos del sistema: cuántos caracteres y qué tipos. Nada de eso sirve para entrar a ningún lado.',
      },
    ],
    verdict: 'Contraseña nueva sin entregar la anterior',
    outcome:
      'Conseguiste tres opciones que cumplen los requisitos sin decirle a la IA cuál era tu clave ni cómo la armas. Cambiarle una letra a la que elijas termina de hacerla tuya.',
  },
}

const SENALES: Senal[] = [
  {
    id: 'clave-en-juego',
    pantalla: 'n1',
    texto:
      'La IA te pregunta por los <b>requisitos del sistema</b>: cuántos caracteres y de qué tipo. Eso es todo lo que necesita — tu contraseña actual no entra en la cuenta.',
  },
]

const RULE =
  'Regla de oro: una contraseña no se escribe en una IA. Ni la actual, ni <b>el patrón con el que la armas</b>: pide los ejemplos en limpio y cámbiale algo a la que elijas.'

const RESUMEN = 'Le pides a una IA que te sugiera una contraseña nueva para el sistema del trabajo.'

const CONTEXTO: Contexto = {
  antes: 'El sistema de inventario de la oficina obliga a cambiar la contraseña cada tres meses, y hoy te tocó.',
  ahora: (
    <>
      <strong>Abres el asistente de IA</strong> en el computador de la oficina para que te sugiera la
      contraseña nueva.
    </>
  ),
}

function ClaveNueva() {
  return (
    <StoryEscenario
      escenarioId="asistentes-ia/correo-credenciales"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule={RULE}
      identidad={['clave']}
      accionesEnPantalla
      cuandoTermina="Cuando toques una de las respuestas del chat."
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Toca una de las respuestas para contestarle a la IA.
        </p>
      }
      pista={
        <p>
          La IA puede proponerte una contraseña sabiendo solo los requisitos del sistema. Lo que decides
          es cuánto le cuentas de la que ya tienes.
        </p>
      }
    />
  )
}

export default ClaveNueva
