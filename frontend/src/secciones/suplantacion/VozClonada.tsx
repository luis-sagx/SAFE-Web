import { Contact, MessageCircle, Phone, Wallet } from 'lucide-react'
import ScenarioStory, { type PhoneApp, type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { ACCOUNT_FAKE } from '../../lib/identidadFicticia'

// El más difícil del módulo: la voz clonada no deja nada que comprobar por sí
// sola. Lo único que funciona es colgar y marcar tú al número de siempre.

const UNKNOWN = '+593 96 302 8874'
const NUMBER_DAUGHTER = '+593 99 712 3380'
const ACCOUNT_SCAM = '5580-3311-27 · Deuna · Luis A. Paredes'

const INCOMING: ScreenView = {
  kind: 'call',
  entrante: true,
  quien: UNKNOWN,
  numero: 'Celular · Ecuador',
  etiqueta: 'No está en tus contactos',
  senalQuien: 'quien',
  contestarGoto: 'n2',
  contestarLabel: 'Contestó la llamada',
  rechazarGoto: 'e_rechaza',
  rechazarLabel: 'Rechazó la llamada sin contestar',
}

const SHOUT = {
  texto: '¡Papi! Papi ayúdame por favor, me chocaron y se llevaron el carro, tengo miedo…',
  rol: 'hija',
  senal: 'voz',
}

const POLICE = {
  texto:
    'Buenas tardes, le habla el sargento Aguirre, de tránsito. Su hija está bien, pero el vehículo con el que chocó es de una persona que no quiere denunciar si se le cubre el daño ahora mismo.',
  rol: 'policia',
  senal: 'autoridad',
}

const CALL: ScreenView = {
  kind: 'call',
  quien: UNKNOWN,
  numero: 'Celular · Ecuador',
  etiqueta: 'No está en tus contactos',
  senalQuien: 'quien',
  dialogo: [SHOUT, POLICE],
  decir: [
    {
      texto: 'Pásemela otra vez, quiero hablar con mi hija.',
      goto: 'n3',
      label: 'Pidió volver a hablar con su hija',
    },
    { texto: '¿Cuánto es y a dónde deposito?', goto: 'n3b', label: 'Preguntó cuánto y dónde pagar' },
  ],
  colgarGoto: 'e_cuelga',
  colgarLabel: 'Colgó al principio de la llamada',
}

const DOES_NOT_CONTINUE: ScreenView = {
  ...CALL,
  dialogo: [
    SHOUT,
    POLICE,
    { texto: 'Pásemela otra vez, quiero hablar con mi hija.', mio: true },
    {
      texto:
        'No puedo pasársela ahora, la están atendiendo los paramédicos. No corte la llamada y no llame a nadie más, porque si esto entra al sistema ya no lo podemos arreglar entre nosotros.',
      rol: 'policia',
      senal: 'no-cuelgue',
    },
  ],
  decir: [
    { texto: '¿Cuánto es y a dónde deposito?', goto: 'n3b', label: 'Preguntó cuánto y dónde pagar' },
    {
      texto: 'Voy a llamar a mi hija ahora mismo.',
      goto: 'n3c',
      label: 'Dijo que iba a llamar a su hija',
    },
  ],
}

const AMOUNT: ScreenView = {
  ...CALL,
  dialogo: [
    SHOUT,
    POLICE,
    { texto: '¿Cuánto es y a dónde deposito?', mio: true },
    {
      texto: `Son cuatrocientos dólares y hay que hacerlo ya. Anote: ${ACCOUNT_SCAM}. No cuelgue mientras transfiere, yo le voy confirmando.`,
      rol: 'policia',
      senal: 'cuenta',
    },
  ],
  decir: [
    {
      texto: 'Voy a llamar a mi hija ahora mismo.',
      goto: 'n3c',
      label: 'Dijo que iba a llamar a su hija',
    },
    {
      texto: 'Deme un momento, entro al banco.',
      goto: 'n5',
      label: 'Fue a la app del banco a hacer la transferencia',
    },
  ],
}

const THREAT: ScreenView = {
  ...CALL,
  dialogo: [
    SHOUT,
    POLICE,
    { texto: 'Voy a llamar a mi hija ahora mismo.', mio: true },
    {
      texto:
        'No lo haga. Si llama, la línea de ella se bloquea y esto pasa a fiscalía. Quédese conmigo y lo resolvemos en cinco minutos.',
      rol: 'policia',
      senal: 'no-cuelgue',
    },
  ],
  decir: [
    {
      texto: 'La voy a llamar igual. Cuelgo.',
      goto: 'e_cuelga_llama',
      label: 'Colgó para llamar a su hija',
    },
    {
      texto: 'Está bien, no llamo. ¿A dónde deposito?',
      goto: 'n3b',
      label: 'Aceptó no llamar y preguntó dónde depositar',
    },
  ],
}

const CONTACTS: ScreenView = {
  kind: 'web',
  app: 'Teléfono',
  url: 'contactos',
  secure: true,
  brand: 'Contactos',
  title: 'Tu agenda',
  opciones: [
    {
      texto: 'Camila · Hija',
      detalle: `${NUMBER_DAUGHTER} · su número de siempre`,
      goto: 'e_verifica',
      label: 'Llamó a su hija al número de siempre',
    },
    { texto: 'Casa', detalle: '02 244 1180' },
    { texto: 'Emergencias · ECU 911', detalle: '911' },
    { texto: 'Trabajo', detalle: '02 380 1100' },
  ],
  fields: [],
  button: '',
}

const CALL_DAUGHTER: ScreenView = {
  kind: 'call',
  quien: 'Camila · Hija',
  numero: NUMBER_DAUGHTER,
  etiqueta: 'Guardada en tus contactos',
  dialogo: [
    {
      texto:
        '¿Aló, pa? Estoy en clase, ¿qué pasó? No, yo estoy bien, no choqué nada. El carro está en el parqueadero de la universidad.',
      rol: 'hija',
      senal: 'contesta',
    },
  ],
}

const BANK: ScreenView = {
  kind: 'web',
  app: 'Banco del Litoral',
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Banca móvil',
  title: 'Tus cuentas',
  subtitle: `${ACCOUNT_FAKE} · disponible $980,20`,
  opciones: [
    {
      texto: 'Transferir',
      detalle: 'A cuentas propias o de terceros',
      goto: 'n6',
      label: 'Abrió la transferencia en la app del banco',
    },
    { texto: 'Movimientos', detalle: 'Consumos y débitos de los últimos 30 días' },
    { texto: 'Pagar servicios', detalle: 'Luz, agua, teléfono e internet' },
    { texto: 'Mi perfil', detalle: 'Datos, límites y notificaciones' },
  ],
  fields: [],
  button: '',
}

const TRANSFER: ScreenView = {
  kind: 'web',
  app: 'Banco del Litoral',
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Transferir a terceros',
  title: 'Confirma la transferencia',
  subtitle: 'Revisa los datos antes de enviar el dinero.',
  datos: [
    { etiqueta: 'Cuenta de destino', valor: ACCOUNT_SCAM, senal: 'cuenta' },
    { etiqueta: 'Titular', valor: 'Luis A. Paredes' },
    { etiqueta: 'Valor', valor: '$400,00' },
  ],
  aviso: 'Las transferencias enviadas no se pueden reversar.',
  button: 'Transferir $400,00',
  botonGoto: 'e_paga',
  botonLabel: 'Transfirió los $400 mientras seguía en la llamada',
  cerrarGoto: 'n5',
  cerrarLabel: 'Volvió atrás sin transferir',
  fields: [],
}

const APPS: PhoneApp[] = [
  { Icono: Phone, texto: 'Teléfono', color: '#2f9e44', hilo: 'call' },
  {
    Icono: Contact,
    texto: 'Contactos',
    color: '#1971c2',
    goto: 'n4',
    label: 'Abrió la agenda durante la llamada',
  },
  {
    Icono: Wallet,
    texto: 'Banco del Litoral',
    color: '#155e75',
    goto: 'n5',
    label: 'Abrió la app del banco durante la llamada',
  },
  {
    Icono: MessageCircle,
    texto: 'Mensajes',
    color: '#495057',
    vacia: 'No tienes mensajes nuevos. Camila no te ha escrito nada hoy.',
  },
]

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: INCOMING },
  n2: { kind: 'scene', view: CALL },
  n3: { kind: 'scene', view: DOES_NOT_CONTINUE },
  n3b: { kind: 'scene', view: AMOUNT },
  n3c: { kind: 'scene', view: THREAT },
  n4: { kind: 'scene', view: CONTACTS },
  n5: { kind: 'scene', view: BANK },
  n6: { kind: 'scene', view: TRANSFER },
  e_rechaza: {
    kind: 'partial',
    view: INCOMING,
    verdict: 'No perdiste nada, pero no contestar no siempre basta',
    outcome:
      'No contestaste y no perdiste un centavo. Aun así, quien monta esto vuelve a intentarlo, y a veces con alguien de tu casa que sí contesta: lo que conviene es hablarlo en familia y acordar una pregunta que solo ustedes sepan responder.',
    score: 50,
  },
  e_cuelga: {
    kind: 'partial',
    view: CALL,
    verdict: 'Colgaste, pero te quedaste con el susto',
    outcome:
      'Colgar fue lo correcto y no entregaste nada. Lo que falta es la otra mitad: llamar a tu hija para saber que está bien. Sin eso te queda la duda toda la tarde, que es exactamente con lo que cuentan para que vuelvas a llamarles tú.',
    score: 50,
  },
  e_cuelga_llama: {
    kind: 'good',
    view: CALL_DAUGHTER,
    verdict: 'No caíste · colgaste y la llamaste',
    outcome:
      'Camila contestó desde la universidad, en clase y con el carro en el parqueadero. Colgaste mientras te decían que no colgaras, que es lo más difícil de hacer con miedo y lo único que funciona.',
  },
  e_verifica: {
    kind: 'good',
    view: CALL_DAUGHTER,
    verdict: 'No caíste · la llamaste a su número',
    outcome:
      'Dejaste la llamada esperando y marcaste el número de tu hija: contestó a la primera, estaba en clase y no había pasado nada. Nunca hubo accidente ni sargento; la voz que oíste llorando se hizo con unos segundos de audio de sus redes.',
  },
  e_paga: {
    kind: 'bad',
    view: TRANSFER,
    verdict: 'Caíste en la suplantación',
    outcome:
      'Transferiste $400 mientras seguías al teléfono. No hubo accidente: tu hija estaba en clase. La voz que te hizo llorar se generó con unos segundos de audio de un video suyo, y el "sargento" no existe. En cuanto llegó el dinero, cortaron.',
  },
}

const SIGNALS: Signal[] = [
  {
    id: 's1',
    targetId: 'voz',
    pantalla: 'n2',
    texto:
      'La voz <b>es la suya y aun así no prueba nada</b>: se clona con unos segundos de cualquier video. Llora y grita para que no dudes.',
  },
  {
    id: 's2',
    targetId: 'autoridad',
    pantalla: 'n2',
    texto:
      'Aparece enseguida <b>una autoridad</b> que toma el control. Un policía real no cobra un choque por teléfono.',
  },
  {
    id: 's3',
    targetId: 'no-cuelgue',
    pantalla: 'n3',
    texto:
      '<b>No cuelgue y no llame a nadie.</b> Lo único que rompe el engaño es que hables con tu hija.',
  },
  {
    id: 's4',
    targetId: 'cuenta',
    pantalla: 'n3b',
    texto:
      'El dinero va a una <b>cuenta personal</b> y hay que mandarlo ya, sin papeles ni parte policial.',
  },
  {
    id: 's5',
    targetId: 'contesta',
    pantalla: 'e_verifica',
    texto:
      'Tu hija <b>contestó a la primera</b> desde su número de siempre. Treinta segundos contra $400.',
  },
]

const RULE =
  'Regla de oro: cuando alguien llame diciendo que un familiar tuyo está en problemas, <b>cuelga y llama tú a esa persona</b> a su número de siempre. La voz ya no es una prueba, y el "no cuelgue" es justamente la señal de que hay que colgar.'

const SUMMARY = 'Llamas a contestar y oyes a tu hija llorando: dice que tuvo un accidente.'

const CONTEXT: Context = {
  antes: (
    <>
      Tu hija <strong>Camila</strong> está en la universidad esta tarde y se llevó el carro, como
      todos los días.
    </>
  ),
  ahora: (
    <>
      <strong>A media tarde</strong> te llama un número que no conoces. Al contestar, oyes su voz.
    </>
  ),
}

function ClonedVoice() {
  return (
    <ScenarioStory
      escenarioId="suplantacion/voz-clonada"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      senales={SIGNALS}
      rule={RULE}
      restartLabel="↻ Recibir la llamada otra vez"
      accionesEnPantalla
      apps={APPS}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Actúa sobre el teléfono como lo harías con el tuyo: contesta o rechaza, cuelga cuando
          quieras y usa <strong>cualquier app de abajo</strong>, incluso con la llamada abierta.
        </p>
      }
      pista={
        <p>
          Puedes no contestar, hablar con quien llama, colgar en cualquier momento, hacer lo que te
          piden desde la app del banco o dejar la llamada esperando y marcar tú a tu hija.
        </p>
      }
    />
  )
}

export default ClonedVoice
