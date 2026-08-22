import { Camera, Contact, MessageCircle, Phone } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { CUENTA_FICTICIA, IDENTIDAD_FICTICIA } from '../../lib/identidadFicticia'

/**
 * El cambio de número que sí era verdad.
 *
 * Espeja a cambio-numero frase por frase: mismo "se me dañó el celular", misma
 * nota de voz, mismo número desconocido. Lo que cambia es lo que viene
 * después — aquí nadie pide dinero, nadie mete prisa y la llamada se contesta
 * al primer timbre.
 *
 * Sin este caso el módulo enseñaría "desconfía de todo número nuevo", que no
 * es criterio sino miedo: la gente cambia de número de verdad, y dejar
 * colgada a tu tía tiene su propio costo. Y aun siendo ella, hay cosas que no
 * se mandan por un chat: la foto de la cédula es una de ellas.
 */

const TIA = 'Rocío'
const NUMERO_NUEVO = '+593 98 052 6614'

const SALUDO = {
  text: 'Mijo, soy tu tía Rocío 🙋‍♀️ se me perdió el celular el sábado en el bus. Ya saqué otro chip, este es mi número nuevo, guárdamelo cuando puedas.',
  time: '11:05',
  senal: 'saludo',
}

const AUDIO = {
  text: 'Mijo, no te asustes, es tu tía Rocío. Nada grave, solo que perdí el celular en el bus el sábado y recién pude sacar otro chip. Cuando puedas me guardas este número, y salúdame a tu mamá.',
  time: '11:06',
  voz: '0:12',
  rol: 'mujer',
  senal: 'audio',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: NUMERO_NUEVO,
  sub: 'No está en tus contactos · toca para ver el perfil',
  senalRemitente: 'remitente',
  perfilGoto: 'n1b',
  perfilLabel: 'Abrió el perfil del número que le escribía',
  msgs: [SALUDO, AUDIO],
  respuestas: [
    {
      texto: 'Tía, ¿usted es? Déjeme llamarla.',
      goto: 'n2',
      label: 'Dijo que iba a llamarla para comprobar',
    },
    {
      texto: '¿Cómo se llamaba el perro que tenía en Santo Domingo?',
      goto: 'n2b',
      label: 'Preguntó algo que solo su tía sabría',
    },
    {
      texto: 'Listo tía, ya la guardo.',
      goto: 'n3',
      label: 'Guardó el número sin comprobar nada',
    },
  ],
  volverGoto: 'e_ignora',
  volverLabel: 'Salió del chat sin contestar',
}

const PERFIL: ScreenView = {
  kind: 'web',
  app: 'Mensajes',
  url: 'perfil',
  secure: true,
  brand: 'Información del contacto',
  title: NUMERO_NUEVO,
  subtitle: 'No guardado en tu agenda.',
  datos: [
    { etiqueta: 'Foto de perfil', valor: 'La de tu tía con tu prima, de la fiesta de diciembre' },
    { etiqueta: 'En esta app desde', valor: 'Hace 2 días', senal: 'antiguedad' },
    { etiqueta: 'Grupos en común', valor: 'Ninguno todavía', senal: 'antiguedad' },
  ],
  aviso:
    'Una cuenta recién creada no prueba nada por sí sola: la tiene igual quien acaba de cambiar de chip y quien acaba de copiar un perfil. Lo que decide es lo que pase después.',
  cerrarGoto: 'n1',
  cerrarLabel: 'Volvió al chat desde el perfil',
  fields: [],
  button: '',
}

const CONTESTA: ScreenView = {
  kind: 'call',
  quien: TIA,
  numero: NUMERO_NUEVO,
  etiqueta: 'Número nuevo, sin guardar',
  dialogo: [
    {
      texto:
        '¡Aló, mijo! Sí, soy yo. Qué bueno que me llamas, así te queda grabado el número. No, no necesito nada, solo avisarte. Salúdame a tu mamá y nos vemos el domingo.',
      rol: 'mujer',
      senal: 'contesta',
    },
  ],
  decir: [
    {
      texto: 'Listo tía, ya la guardo. ¿Necesita algo?',
      goto: 'n3',
      label: 'Siguió la conversación tras confirmar que era ella',
    },
  ],
  colgarGoto: 'e_verifica',
  colgarLabel: 'Colgó tras confirmar que era su tía',
}

const RESPONDE_BIEN: ScreenView = {
  ...CHAT,
  msgs: [
    SALUDO,
    AUDIO,
    {
      text: '¿Cómo se llamaba el perro que tenía en Santo Domingo?',
      time: '11:08',
      mine: true,
    },
    {
      text: 'Ay mijo 😂 Canelo, y me mordía las plantas. ¿Ya me crees? Llámame cuando quieras, aquí estoy.',
      time: '11:09',
      senal: 'responde',
    },
  ],
  respuestas: [
    {
      texto: 'Jajaja listo tía, ya la guardo. ¿Necesita algo?',
      goto: 'n3',
      label: 'Guardó el número tras comprobar quién era',
    },
  ],
}

/// Ella no pide nada, y ahí termina lo normal. Lo que llega después —una foto
/// de la cédula— es lo único del escenario que no se manda ni a la familia.
const PIDE_CEDULA: ScreenView = {
  ...CHAT,
  msgs: [
    SALUDO,
    AUDIO,
    { text: 'Listo tía, ya la guardo.', time: '11:10', mine: true },
    {
      text: 'Gracias mijo. Oye, aprovecho: estoy haciendo el trámite del seguro y me piden los datos de los sobrinos. Mándame tu número de cuenta y una foto de tu cédula por los dos lados.',
      time: '11:12',
      senal: 'cedula',
    },
  ],
  respuestas: [
    {
      texto: `Le paso mi cuenta: ${CUENTA_FICTICIA}. Y la cédula ya se la mando.`,
      goto: 'e_cedula',
      label: 'Mandó su cuenta y la foto de su cédula por el chat',
    },
    {
      texto: 'La cuenta sí, la cédula mejor se la llevo el domingo.',
      goto: 'e_prudente',
      label: 'Dio la cuenta pero no mandó la cédula por el chat',
    },
  ],
}

const AGENDA: ScreenView = {
  kind: 'web',
  app: 'Teléfono',
  url: 'contactos',
  secure: true,
  brand: 'Contactos',
  title: 'Tu agenda',
  opciones: [
    {
      texto: `Tía ${TIA} · número anterior`,
      detalle: '+593 99 331 7742 · el que tenías guardado, ahora apagado',
      goto: 'n5',
      label: 'Llamó al número anterior de su tía',
    },
    { texto: 'Mamá', detalle: '+593 99 445 1120' },
    { texto: 'Casa', detalle: '02 244 1180' },
    { texto: 'Trabajo', detalle: '02 380 1100' },
  ],
  fields: [],
  button: '',
}

const APAGADO: ScreenView = {
  kind: 'web',
  app: 'Teléfono',
  url: 'llamada',
  secure: true,
  brand: 'Llamada terminada',
  title: 'El número anterior está apagado',
  subtitle: 'Una grabación dice que el teléfono se encuentra apagado o fuera del área de servicio.',
  datos: [
    {
      etiqueta: 'Qué significa',
      valor: 'Encaja con lo que te contó: perdió ese celular y ese chip ya no está activo',
      senal: 'apagado',
    },
    { etiqueta: 'Qué falta', valor: 'Hablar con ella en el número nuevo, o preguntarle algo suyo' },
  ],
  cerrarGoto: 'n4',
  cerrarLabel: 'Volvió a la agenda',
  fields: [],
  button: '',
}

const APPS: AppTelefono[] = [
  { Icono: MessageCircle, texto: 'Mensajes', color: '#2f9e44', hilo: 'sms' },
  {
    Icono: Contact,
    texto: 'Teléfono',
    color: '#1971c2',
    goto: 'n4',
    label: 'Abrió la agenda',
  },
  {
    Icono: Phone,
    texto: 'Llamadas',
    color: '#0b7285',
    vacia: 'Sin llamadas recientes. Tu tía no te ha llamado desde ningún número.',
  },
  {
    Icono: Camera,
    texto: 'Cámara',
    color: '#495057',
    vacia: 'La cámara está lista. No hay nada que fotografiar en este momento.',
  },
]

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: CHAT },
  n1b: { kind: 'scene', view: PERFIL },
  n2: { kind: 'scene', view: CONTESTA },
  n2b: { kind: 'scene', view: RESPONDE_BIEN },
  n3: { kind: 'scene', view: PIDE_CEDULA },
  n4: { kind: 'scene', view: AGENDA },
  n5: { kind: 'scene', view: APAGADO },
  e_cedula: {
    kind: 'bad',
    view: PIDE_CEDULA,
    verdict: 'Era tu tía, y aun así entregaste de más',
    outcome: `El mensaje era auténtico: tu tía Rocío sí cambió de número. Pero le mandaste por chat la foto de tu cédula ${IDENTIDAD_FICTICIA.cedula} por los dos lados, y eso ya no depende de ella: queda guardado en un teléfono que acaba de perder una vez, y con esa foto se abren cuentas y se piden créditos a tu nombre. El número de cuenta sí se puede dar; la cédula, no por ahí.`,
    score: 0,
  },
  e_prudente: {
    kind: 'good',
    view: PIDE_CEDULA,
    verdict: 'Acertaste · era ella, y aun así no mandaste la cédula',
    outcome:
      'El mensaje era de verdad y tú contestaste como se debe: le diste lo que no cuesta nada dar y dejaste la cédula para entregársela en mano. Que alguien sea de confianza no vuelve seguro al canal por el que le escribes.',
  },
  e_verifica: {
    kind: 'good',
    view: CONTESTA,
    verdict: 'Acertaste · comprobaste sin desconfiar de más',
    outcome:
      'Era ella. Una llamada de treinta segundos, o una pregunta que solo tu tía podía responder, y asunto resuelto: guardaste el número y quedaron de verse el domingo. Comprobar no es ofender a nadie.',
  },
  e_ignora: {
    kind: 'partial',
    view: CHAT,
    verdict: 'Prudente, pero era tu tía',
    outcome:
      'No contestaste, y eso nunca te va a costar dinero. Pero era ella de verdad: se quedó sin poder avisarte y tú sin su número. Comprobar cuesta una llamada; ignorar cuesta la relación.',
    score: 50,
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'saludo',
    pantalla: 'n1',
    texto:
      '<b>No pide nada.</b> Avisa de un cambio y ya; un mensaje falso siempre acaba pidiendo algo.',
  },
  {
    id: 's2',
    targetId: 'audio',
    pantalla: 'n1',
    texto:
      'La nota de voz <b>no mete prisa</b>. Sola no basta: una voz clonada tampoco sonaría rara.',
  },
  {
    id: 's3',
    targetId: 'antiguedad',
    pantalla: 'n1b',
    texto:
      'La cuenta es <b>nueva</b>, igual que en una suplantación. Quien cambia de chip empieza de cero.',
  },
  {
    id: 's4',
    targetId: 'responde',
    pantalla: 'n2b',
    texto:
      'Contesta <b>lo que solo ella sabría</b>, con detalles. Ninguna suplantación pasa esa prueba.',
  },
  {
    id: 's5',
    targetId: 'contesta',
    pantalla: 'n2',
    texto:
      '<b>Contesta la llamada</b> al primer timbre y sin prisa. Quien suplanta nunca puede hablar.',
  },
  {
    id: 's6',
    targetId: 'cedula',
    pantalla: 'n3',
    texto:
      'Aunque el mensaje sea real, <b>la cédula no se manda por chat</b>: con esa foto se abren cuentas a tu nombre.',
  },
]

const RULE =
  'Regla de oro: comprobar no es desconfiar. Una llamada o una pregunta que solo esa persona sepa responder resuelve un cambio de número en medio minuto, sin ofender a nadie. Y aunque sea tu familia, <b>la cédula y las claves no viajan por chat</b>.'

const RESUMEN = 'Tu tía escribe desde un número nuevo para avisar que perdió el celular.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Tu tía <strong>Rocío</strong> te escribe cada tanto y la ves en las reuniones familiares.
      Tienes su número de siempre guardado.
    </>
  ),
  ahora: (
    <>
      <strong>Un lunes por la mañana</strong> te escribe un número desconocido diciendo que es
      ella, con una nota de voz.
    </>
  ),
  detalle: 'No te pide nada: solo que le guardes el número nuevo.',
}

function NumeroNuevoReal() {
  return (
    <StoryEscenario
      escenarioId="suplantacion/numero-nuevo-real"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
      accionesEnPantalla
      apps={APPS}
      identidad={['cedula', 'cuenta']}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Actúa sobre el teléfono como lo harías con el tuyo: contesta, escucha la nota de voz, mira
          el perfil de quien escribe y usa <strong>cualquier app de abajo</strong>.
        </p>
      }
      pista={
        <p>
          Puedes contestarle, comprobar quién es de varias maneras, dejarlo pasar o seguirle la
          conversación. Aquí no basta con no caer: fíjate también en qué acabas mandando.
        </p>
      }
    />
  )
}

export default NumeroNuevoReal
