import { Camera, MessageCircle, Phone, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { CUENTA_FICTICIA } from '../../lib/identidadFicticia'

/**
 * La puerta de entrada del módulo: "se me dañó el celular, este es mi número
 * nuevo".
 *
 * Es el fraude de suplantación más común del país y el más fácil de cortar:
 * el número de tu hijo lo tienes guardado, y llamarlo cuesta un toque. Todo el
 * ataque consiste en que no lo hagas, y por eso el escenario deja la agenda
 * abierta a un icono de distancia mientras el otro lado te apura.
 *
 * La nota de voz no es adorno: es lo que convierte "alguien dice ser mi hijo"
 * en "es mi hijo". Suena de verdad, porque leer esa frase escrita quita justo
 * la parte que hay que aprender a dudar.
 */

const DESCONOCIDO = '+593 96 118 4402'
const NUMERO_ANDRES = '+593 99 845 2210'
const CUENTA_ESTAFA = '2200-4471-08 · Kevin Loor Zambrano'

const PRIMER_MENSAJE = {
  text: 'Papi buenas, disculpa la hora 🙏 se me dañó el celular y perdí el chip. Este es mi número nuevo, soy Andrés. Guárdalo porfa.',
  time: '21:48',
  senal: 'mensaje',
}

const AUDIO = {
  text: 'Papi, tuve un problema: choqué el carro que me prestó un amigo y necesito depositar trescientos cincuenta dólares ahorita mismo para no meterme en un lío legal. No puedo hablar, estoy usando el celular de alguien.',
  time: '21:52',
  voz: '0:11',
  senal: 'audio',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: DESCONOCIDO,
  sub: 'No está en tus contactos · toca para ver el perfil',
  senalRemitente: 'remitente',
  perfilGoto: 'n1b',
  perfilLabel: 'Abrió el perfil del contacto que le escribía',
  msgs: [PRIMER_MENSAJE],
  respuestas: [
    { texto: '¿Qué pasó, hijo? Cuéntame.', goto: 'n2', label: 'Contestó al número desconocido' },
  ],
  volverGoto: 'e_ignora',
  volverLabel: 'Salió del chat sin contestar ni comprobar',
}

/// La ficha del contacto: donde está todo lo que hace falta para dudar. La
/// foto es la de Andrés —cualquiera la baja de sus redes— y la cuenta se creó
/// anteayer.
const PERFIL: ScreenView = {
  kind: 'web',
  app: 'Mensajes',
  url: 'perfil',
  secure: true,
  brand: 'Información del contacto',
  title: DESCONOCIDO,
  subtitle: 'No guardado en tu agenda.',
  datos: [
    {
      etiqueta: 'Foto de perfil',
      valor: 'La de Andrés, la misma que tiene puesta en sus redes',
      senal: 'foto',
    },
    { etiqueta: 'En esta app desde', valor: 'Hace 2 días', senal: 'antiguedad' },
    { etiqueta: 'Estado', valor: '"Disponible"' },
    { etiqueta: 'Grupos en común', valor: 'Ninguno', senal: 'antiguedad' },
  ],
  cerrarGoto: 'n1',
  cerrarLabel: 'Volvió al chat desde el perfil',
  fields: [],
  button: '',
}

const CHAT_AUDIO: ScreenView = {
  ...CHAT,
  msgs: [PRIMER_MENSAJE, { text: '¿Qué pasó, hijo? Cuéntame.', time: '21:51', mine: true }, AUDIO],
  respuestas: [
    { texto: 'Ya mismo te transfiero, hijo.', goto: 'n3', label: 'Aceptó transferir el dinero' },
    { texto: 'Llámame, quiero oírte.', goto: 'n3b', label: 'Pidió que le llamara' },
    {
      texto: '¿Cómo se llamaba la perra que teníamos cuando eras chico?',
      goto: 'n4',
      label: 'Preguntó algo que solo su hijo sabría',
    },
  ],
}

const CUENTA: ScreenView = {
  ...CHAT,
  msgs: [
    ...(CHAT_AUDIO.kind === 'sms' ? CHAT_AUDIO.msgs : []),
    { text: 'Ya mismo te transfiero, hijo.', time: '21:53', mine: true },
    {
      text: `Gracias pa 🙏 deposita a esta cuenta: ${CUENTA_ESTAFA}. Es de mi amigo, la mía está bloqueada por lo del chip.`,
      time: '21:53',
      senal: 'cuenta',
    },
  ],
  respuestas: [
    {
      texto: 'Esa cuenta no está a tu nombre.',
      goto: 'n3c',
      label: 'Hizo notar que la cuenta era de otra persona',
    },
    {
      texto: 'Ya voy a transferir, dame un minuto.',
      goto: 'n6',
      label: 'Fue a transferir el dinero a la cuenta que le pasaron',
    },
  ],
}

const EXCUSA_CUENTA: ScreenView = {
  ...CHAT,
  msgs: [
    ...(CUENTA.kind === 'sms' ? CUENTA.msgs : []),
    { text: 'Esa cuenta no está a tu nombre.', time: '21:54', mine: true },
    {
      text: 'Ya te dije que es de mi amigo Kevin, él me está ayudando. Papi por favor apúrate que me están esperando 😭',
      time: '21:54',
      senal: 'prisa',
    },
  ],
  respuestas: [
    {
      texto: 'No te voy a mandar nada hasta hablar contigo.',
      goto: 'e_corta',
      label: 'Se negó a transferir sin hablar antes',
    },
    {
      texto: 'Está bien, ya te mando los 350.',
      goto: 'n6',
      label: 'Cedió y fue a transferir el dinero',
    },
  ],
}

const EXCUSA_LLAMADA: ScreenView = {
  ...CHAT,
  msgs: [
    ...(CHAT_AUDIO.kind === 'sms' ? CHAT_AUDIO.msgs : []),
    { text: 'Llámame, quiero oírte.', time: '21:53', mine: true },
    {
      text: 'No puedo hablar pa, este celular no es mío y no tiene saldo. Solo puedo escribirte y mandarte audios 😔',
      time: '21:53',
      senal: 'no-llama',
    },
  ],
  respuestas: [
    {
      texto: '¿Cómo se llamaba la perra que teníamos cuando eras chico?',
      goto: 'n4',
      label: 'Preguntó algo que solo su hijo sabría',
    },
    {
      texto: 'Bueno hijo, dame la cuenta y te mando.',
      goto: 'n3',
      label: 'Aceptó transferir sin haber podido hablar con él',
    },
  ],
}

/// La prueba que ninguna suplantación pasa: algo que no está en internet. La
/// respuesta es siempre la misma —enfadarse y volver a la prisa— porque quien
/// escribe no tiene forma de saberlo.
const PRUEBA: ScreenView = {
  ...CHAT,
  msgs: [
    ...(CHAT_AUDIO.kind === 'sms' ? CHAT_AUDIO.msgs : []),
    {
      text: '¿Cómo se llamaba la perra que teníamos cuando eras chico?',
      time: '21:53',
      mine: true,
    },
    {
      text: 'Papi no es momento de juegos, estoy en un problema serio. ¿Me vas a ayudar o no? 😡',
      time: '21:54',
      senal: 'esquiva',
    },
  ],
  respuestas: [
    {
      texto: 'No te voy a mandar nada hasta hablar contigo.',
      goto: 'e_corta',
      label: 'Se negó a transferir sin hablar antes',
    },
    {
      texto: 'Ya, perdón hijo. Dame la cuenta.',
      goto: 'n3',
      label: 'Se disculpó y aceptó transferir',
    },
  ],
}

/// La agenda. Llamar al número de siempre es la comprobación entera, y está a
/// un icono de distancia mientras el chat te apura.
const AGENDA: ScreenView = {
  kind: 'web',
  app: 'Teléfono',
  url: 'contactos',
  secure: true,
  brand: 'Contactos',
  title: 'Tu agenda',
  opciones: [
    {
      texto: 'Andrés · Hijo',
      detalle: `${NUMERO_ANDRES} · el número que siempre has tenido guardado`,
      goto: 'e_verifica',
      label: 'Llamó a su hijo al número de siempre',
    },
    { texto: 'Casa', detalle: '02 244 1180' },
    { texto: 'Farmacia La Espiga', detalle: '+593 98 220 3311' },
    { texto: 'Taller Vélez', detalle: '+593 99 100 4477' },
  ],
  fields: [],
  button: '',
}

const LLAMADA_HIJO: ScreenView = {
  kind: 'call',
  quien: 'Andrés · Hijo',
  numero: NUMERO_ANDRES,
  etiqueta: 'Guardado en tus contactos',
  dialogo: [
    {
      texto:
        '¿Aló, papi? No, yo estoy en la casa, acabo de cenar. Mi celular está bien y no cambié de número. ¿Quién te escribió?',
      senal: 'contesta',
    },
  ],
  colgarGoto: undefined,
}

const BANCO: ScreenView = {
  kind: 'web',
  app: 'Banco del Litoral',
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Banca móvil',
  title: 'Tus cuentas',
  subtitle: `${CUENTA_FICTICIA} · disponible $980,20`,
  opciones: [
    {
      texto: 'Transferir',
      detalle: 'A cuentas propias o de terceros',
      goto: 'n7',
      label: 'Abrió la transferencia en la app del banco',
    },
    { texto: 'Movimientos', detalle: 'Consumos y débitos de los últimos 30 días' },
    { texto: 'Pagar servicios', detalle: 'Luz, agua, teléfono e internet' },
    { texto: 'Mi perfil', detalle: 'Datos, límites y notificaciones' },
  ],
  fields: [],
  button: '',
}

const TRANSFERENCIA: ScreenView = {
  kind: 'web',
  app: 'Banco del Litoral',
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Transferir a terceros',
  title: 'Confirma la transferencia',
  subtitle: 'Revisa los datos antes de enviar el dinero.',
  datos: [
    { etiqueta: 'Cuenta de destino', valor: CUENTA_ESTAFA, senal: 'cuenta' },
    { etiqueta: 'Titular', valor: 'Kevin Loor Zambrano' },
    { etiqueta: 'Valor', valor: '$350,00' },
  ],
  aviso: 'Las transferencias enviadas no se pueden reversar.',
  button: 'Transferir $350,00',
  botonGoto: 'e_paga',
  botonLabel: 'Transfirió los $350 a la cuenta que le pasaron por el chat',
  cerrarGoto: 'n6',
  cerrarLabel: 'Volvió atrás sin transferir',
  fields: [],
}

const APPS: AppTelefono[] = [
  { Icono: MessageCircle, texto: 'Mensajes', color: '#2f9e44', hilo: 'sms' },
  {
    Icono: Phone,
    texto: 'Teléfono',
    color: '#1971c2',
    goto: 'n5',
    label: 'Abrió la agenda para llamar por su cuenta',
  },
  {
    Icono: Wallet,
    texto: 'Banco del Litoral',
    color: '#155e75',
    goto: 'n6',
    label: 'Abrió la app del banco',
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
  n2: { kind: 'scene', view: CHAT_AUDIO },
  n3: { kind: 'scene', view: CUENTA },
  n3b: { kind: 'scene', view: EXCUSA_LLAMADA },
  n3c: { kind: 'scene', view: EXCUSA_CUENTA },
  n4: { kind: 'scene', view: PRUEBA },
  n5: { kind: 'scene', view: AGENDA },
  n6: { kind: 'scene', view: BANCO },
  n7: { kind: 'scene', view: TRANSFERENCIA },
  e_paga: {
    kind: 'bad',
    view: TRANSFERENCIA,
    verdict: 'Caíste en la suplantación',
    outcome:
      'Los $350 salieron a la cuenta de un desconocido y no se pueden reversar. Andrés estaba en su casa, con su celular de siempre: nunca chocó ningún carro. La foto era suya, sacada de sus redes, y la voz del audio también, hecha con un programa a partir de cualquier video en el que sale hablando.',
  },
  e_verifica: {
    kind: 'good',
    view: LLAMADA_HIJO,
    verdict: 'No caíste · llamaste al número de siempre',
    outcome:
      'Andrés contestó a la primera desde su número de toda la vida: estaba en casa y no había pasado nada. Un toque en la agenda desmonta el engaño entero, y por eso el mensaje insiste tanto en que no llames.',
  },
  e_corta: {
    kind: 'good',
    view: PRUEBA,
    verdict: 'No caíste · no mandaste nada',
    outcome:
      'Te plantaste: sin hablar con tu hijo, no hay transferencia. No hizo falta demostrar que era mentira ni discutir; basta con no mandar dinero a alguien cuya voz oíste pero cuya cara no viste. Ahora llama a Andrés a su número para quedarte tranquilo.',
  },
  e_ignora: {
    kind: 'partial',
    view: CHAT,
    verdict: 'No perdiste nada, pero te quedaste con la duda',
    outcome:
      'Saliste del chat sin contestar, y eso evita el daño. Pero tampoco comprobaste nada: si de verdad le hubiera pasado algo a Andrés, te habrías enterado más tarde. La duda se resuelve llamando al número que ya tienes guardado, no dejándola pasar.',
    score: 50,
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'remitente',
    pantalla: 'n1',
    texto:
      'Escribe un <b>número que no tienes guardado</b>. Que diga ser tu hijo es justo lo que hay que comprobar.',
  },
  {
    id: 's2',
    targetId: 'foto',
    pantalla: 'n1b',
    texto:
      'La <b>foto de perfil es la de Andrés</b>, y está pública en sus redes: cualquiera la descarga.',
  },
  {
    id: 's3',
    targetId: 'antiguedad',
    pantalla: 'n1b',
    texto:
      'Esa cuenta <b>se creó hace dos días</b> y no comparte contigo ningún grupo.',
  },
  {
    id: 's4',
    targetId: 'audio',
    pantalla: 'n2',
    texto:
      'La voz suena a la suya, y hoy eso <b>ya no prueba nada</b>: se clona con unos segundos de audio.',
  },
  {
    id: 's5',
    targetId: 'no-llama',
    pantalla: 'n3b',
    texto:
      'Siempre hay una razón para <b>no poder hablar</b>. Una conversación en vivo se les cae.',
  },
  {
    id: 's6',
    targetId: 'cuenta',
    pantalla: 'n3',
    texto:
      'La cuenta está <b>a nombre de otra persona</b>, nunca de quien dice necesitar el dinero.',
  },
  {
    id: 's7',
    targetId: 'esquiva',
    pantalla: 'n4',
    texto:
      'Ante una pregunta que <b>solo tu hijo sabría</b>, se enfada y vuelve a la prisa. No puede contestarla.',
  },
]

const RULE =
  'Regla de oro: si un número nuevo dice ser alguien conocido y pide dinero, <b>llama tú al número de siempre antes de mandar nada</b>. Una foto de perfil y hasta una voz se copian; una llamada a tu propia agenda, no.'

const RESUMEN = 'Un número desconocido dice ser tu hijo, que perdió el celular, y pide dinero.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Tu hijo <strong>Andrés</strong> vive fuera de casa y hablan casi a diario. Tienes su número
      guardado desde siempre.
    </>
  ),
  ahora: (
    <>
      <strong>Casi a las diez de la noche</strong> te escribe un número que no conoces, diciendo que
      es él.
    </>
  ),
}

function CambioNumero() {
  return (
    <StoryEscenario
      escenarioId="suplantacion/cambio-numero"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
      accionesEnPantalla
      apps={APPS}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Actúa sobre el teléfono como lo harías con el tuyo: contesta, toca el nombre del contacto
          para ver su perfil, escucha la nota de voz y usa{' '}
          <strong>cualquier app de abajo</strong>.
        </p>
      }
      pista={
        <p>
          Puedes seguirle la conversación, mirar quién te escribe, salir del chat, hacer lo que te
          pide desde la app del banco o llamar por tu cuenta a quien dice ser. Cuál de ellos es el
          acertado es justamente lo que decides tú.
        </p>
      }
    />
  )
}

export default CambioNumero
