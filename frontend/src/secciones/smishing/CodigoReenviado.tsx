import { Compass, MessageSquareText, Phone, Wallet } from 'lucide-react'
import ScenarioStory, { type PhoneApp, type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'

// El más difícil del módulo: la mitad de lo que se ve es auténtico. El código llega de
// verdad (el atacante lo pidió con el número de la víctima); lo falso es que lo pidan reenviado.

const CODE = '731 640'

const THREAD_FAKE: ScreenView = {
  kind: 'sms',
  sender: '+593 99 412 8867',
  sub: 'Número no guardado · SMS',
  senalRemitente: 'remitente',
  msgs: [
    {
      text: 'Buenas tardes, le habla Andrea Vaca del área de seguridad del Banco del Litoral. Detectamos un intento de acceso a su banca en línea desde Guayaquil y lo estamos bloqueando.',
      time: '20:41',
    },
    {
      text: `Para confirmar que es usted y cerrar el caso, por favor reenvíeme el código de seis dígitos que le acaba de llegar. Es solo de verificación, no autoriza ninguna operación.`,
      time: '20:42',
      senal: 'piden-codigo',
    },
  ],
  // Negarse no gana del todo: no darlo evita el daño, pero deja el aviso sin
  // comprobar y a ellos con la conversación abierta.
  respuestas: [
    {
      texto: 'Te reenvío el código.',
      goto: 'e_reenvia',
      label: 'Reenvió el código al número desconocido',
    },
    {
      texto: 'Ese código no se lo puedo pasar a nadie.',
      goto: 'e_niega',
      label: 'Se negó a reenviar el código',
    },
  ],
  volverGoto: 'n2',
  volverLabel: 'Salió del hilo a la lista de mensajes',
}

// El veredicto se ve sobre la burbuja propia: hay que enseñar que el código salió del teléfono.
const THREAD_SENT: ScreenView = {
  ...THREAD_FAKE,
  respuestas: undefined,
  volverGoto: undefined,
  msgs: [
    ...(THREAD_FAKE.kind === 'sms' ? THREAD_FAKE.msgs : []),
    { text: `Te reenvío el código: ${CODE}`, time: '20:43', mine: true, senal: 'reenvio' },
  ],
}

const DECLINED_THREAD: ScreenView = {
  ...THREAD_SENT,
  msgs: [
    ...(THREAD_FAKE.kind === 'sms' ? THREAD_FAKE.msgs : []),
    { text: 'Ese código no se lo puedo pasar a nadie.', time: '20:43', mine: true },
  ],
}

// Después de comprobar en la app: negarse ahora sí cierra el escenario, ya no queda nada pendiente.
const VERIFIED_THREAD: ScreenView = {
  ...THREAD_FAKE,
  respuestas: [
    {
      texto: 'Te reenvío el código.',
      goto: 'e_reenvia',
      label: 'Reenvió el código al número desconocido, después de comprobar que no hacía falta',
    },
    {
      texto: 'Ese código no se lo puedo pasar a nadie.',
      goto: 'e_app',
      label: 'Se negó a reenviar el código después de comprobar que no había ningún acceso',
    },
  ],
}

// La vista previa del banco enseña el código, y los dos remitentes quedan uno debajo del otro para comparar.
const LIST: ScreenView = {
  kind: 'web',
  app: 'Mensajes',
  url: 'lista',
  secure: true,
  brand: 'Mensajes',
  title: 'Conversaciones',
  cerrarGoto: 'e_ignora',
  cerrarLabel: 'Salió de los mensajes sin hacer nada',
  opciones: [
    {
      texto: 'BANCO LITORAL',
      detalle: `Su código de verificación es ${CODE}… · 20:40`,
      goto: 'n3',
      label: 'Abrió el mensaje que envió el banco',
    },
    {
      texto: '+593 99 412 8867',
      detalle: 'Para confirmar que es usted y cerrar el caso… · 20:42',
      goto: 'n1',
      label: 'Volvió a la conversación del número desconocido',
    },
    { texto: 'Mamá', detalle: '¿Llegaste bien? · ayer' },
    { texto: 'ENVIAEXPRESS', detalle: 'Su envío fue entregado. Gracias por preferirnos. · lun' },
  ],
  fields: [],
  button: '',
}

// El mensaje auténtico: todo en él está bien, y lleva escrita la defensa. El escenario entero en dos líneas.
const THREAD_BANK: ScreenView = {
  kind: 'sms',
  sender: 'BANCO LITORAL',
  sub: 'Remitente habitual · SMS',
  senalRemitente: 'remitente-real',
  msgs: [
    {
      text: `Su codigo de verificacion es ${CODE}. Vence en 5 minutos. NUNCA lo comparta con nadie, ni con personal del banco.`,
      time: '20:40',
      senal: 'aviso-real',
    },
  ],
  volverGoto: 'n2',
  volverLabel: 'Volvió a la lista de mensajes',
}

// Abrir la app todavía no es haber comprobado nada: se puede mirar la actividad
// o cambiar la clave a ciegas, que es el gesto precipitado que este escenario mide.
const BANK_HOME: ScreenView = {
  kind: 'web',
  app: 'Banco',
  url: 'inicio',
  secure: true,
  brand: 'Banco del Litoral · Banca móvil',
  title: 'Cuenta de ahorros',
  subtitle: 'Saldo disponible $312,45',
  opciones: [
    { texto: 'Transferir', detalle: 'A cuentas propias o de terceros' },
    {
      texto: 'Seguridad de la cuenta',
      detalle: 'Accesos, dispositivos y códigos solicitados',
      goto: 'n_seguridad',
      label: 'Revisó la actividad y los accesos de su cuenta en la app',
    },
    { texto: 'Movimientos', detalle: 'Débitos y transferencias de los últimos 30 días' },
    {
      texto: 'Cambiar mi clave',
      detalle: 'Define una clave nueva para tu banca en línea',
      goto: 'e_clave',
      label: 'Cambió la clave sin comprobar antes si había algún acceso',
    },
  ],
  fields: [],
  button: '',
  cerrarGoto: 'n_sms_verificado',
  cerrarLabel: 'Cerró la app del banco',
}

const APP_BANK: ScreenView = {
  kind: 'web',
  app: 'Banco',
  url: 'inicio',
  secure: true,
  brand: 'Banco del Litoral · Banca móvil',
  title: 'Seguridad de tu cuenta',
  subtitle: 'Actividad de los últimos siete días.',
  datos: [
    {
      etiqueta: 'Intentos de acceso',
      valor: 'Ninguno desde otro dispositivo',
      senal: 'sin-intento',
    },
    { etiqueta: 'Solicitud de código', valor: 'Una, hace dos minutos, aún sin usar' },
    { etiqueta: 'Atención al cliente', valor: '1700 123 456 · el mismo del reverso de tu tarjeta' },
  ],
  aviso:
    'El código que te enviamos autoriza operaciones en tu cuenta. Nadie del banco te lo pedirá nunca, ni por llamada, ni por mensaje, ni por correo. Si alguien te lo pide, es un intento de fraude.',
  fields: [],
  button: '',
  // Al hilo del impostor, no a la lista: sigue esperando respuesta, comprobar solo no cierra ese frente.
  cerrarGoto: 'n1c',
  cerrarLabel: 'Cerró la app después de ver que no había accesos no autorizados',
}

const APPS: PhoneApp[] = [
  {
    Icono: Wallet,
    texto: 'Banco',
    color: '#155e75',
    goto: 'n4',
    label: 'Abrió la app del banco para comprobar el intento de acceso',
  },
  { Icono: MessageSquareText, texto: 'Mensajes', color: '#2f9e44' },
  {
    Icono: Phone,
    texto: 'Teléfono',
    color: '#495057',
    vacia: 'Sin llamadas recientes. Puedes marcar un número desde aquí.',
  },
  {
    Icono: Compass,
    texto: 'Navegador',
    color: '#1971c2',
    vacia: 'Nueva pestaña. No hay ninguna dirección escrita todavía.',
  },
]

const STORY: Story<ScreenNode> = {
  n1: {
    kind: 'scene',
    view: THREAD_FAKE,
    // El banner deja los seis dígitos y recorta la advertencia; leerla entera cuesta un toque.
    notificacion: {
      app: 'Mensajes',
      remitente: 'BANCO LITORAL',
      hora: '20:40',
      texto: `Su codigo de verificacion es ${CODE}. Vence en 5 minutos. NUNCA lo comparta con nadie, ni con personal del banco.`,
      goto: 'n3',
      label: 'Abrió la notificación del código que envió el banco',
    },
  },
  n1c: { kind: 'scene', view: VERIFIED_THREAD },
  n2: { kind: 'scene', view: LIST },
  n3: { kind: 'scene', view: THREAD_BANK },
  n4: { kind: 'scene', view: BANK_HOME },
  n_seguridad: { kind: 'scene', view: APP_BANK },
  e_reenvia: {
    kind: 'bad',
    view: THREAD_SENT,
    verdict: 'Caíste en la trampa',
    outcome:
      'No había ningún intento de acceso: quien entraba a tu banca era quien te escribía, y le faltaba ese código. Vaciaron la cuenta en tres transferencias, y como el código lo enviaste tú, quedó autorizada.',
  },
  e_app: {
    kind: 'good',
    // Misma burbuja que e_niega: el mensaje que sale del teléfono es idéntico, solo cambia que aquí ya habías comprobado.
    view: DECLINED_THREAD,
    verdict: 'No caíste · lo comprobaste donde consta',
    outcome:
      'No había ningún acceso desde otro dispositivo. Sí una solicitud de código de hace dos minutos, sin usar: la pidieron ellos, esperando que se la reenviaras. Y encima, te negaste a dársela.',
  },
  e_clave: {
    kind: 'partial',
    view: BANK_HOME,
    verdict: 'Cambiaste la clave, pero el código sigue vivo',
    outcome:
      'No reenviaste el código, que es lo que importaba. Pero cambiar la clave no cancela la solicitud ya hecha: ese código sirve hasta que venza. Los accesos estaban en "Seguridad de la cuenta".',
  },
  e_niega: {
    kind: 'partial',
    view: DECLINED_THREAD,
    verdict: 'No lo diste, pero les seguiste contestando',
    outcome:
      'No entregaste el código, que es lo que importaba. Pero contestaste a un número desconocido: ahora saben que alguien lee esa línea. Y la solicitud de ese código sigue viva.',
  },
  e_ignora: {
    kind: 'partial',
    view: LIST,
    verdict: 'No lo reenviaste, pero te quedaste con la duda',
    outcome:
      'No diste el código, que es lo único que impedía que entraran. Pero saliste sin comprobar nada: si el aviso hubiera sido cierto, seguirían intentándolo.',
  },
}

const SIGNALS: Signal[] = [
  {
    id: 's1',
    targetId: 'aviso-real',
    pantalla: 'n3',
    texto:
      'El mensaje del banco es <b>auténtico</b> y lleva la defensa escrita: <b>"nunca lo comparta, ni con personal del banco"</b>.',
  },
  {
    id: 's2',
    targetId: 'piden-codigo',
    pantalla: 'n1',
    texto:
      'Dice que el código <b>"no autoriza ninguna operación"</b>. Es al revés: autoriza, y por eso lo quieren.',
  },
  {
    id: 's3',
    targetId: 'remitente',
    pantalla: 'n1',
    texto:
      'Llega de un <b>número de celular cualquiera</b>, no del remitente por el que te escribe siempre tu banco.',
  },
  {
    id: 's4',
    targetId: 'reenvio',
    pantalla: 'e_reenvia',
    texto:
      'Reenviar el código es <b>firmar la operación</b> que hacen al otro lado. No te identifica: autoriza.',
  },
  {
    id: 's5',
    targetId: 'sin-intento',
    pantalla: 'e_app',
    texto:
      'En la app <b>no consta ningún intento de acceso</b>. Lo que sí consta es la solicitud del código: la pidieron ellos.',
  },
]

const RULE =
  'Regla de oro: <b>un código que llega a tu teléfono no se reenvía a nadie</b>, ni aunque quien lo pida diga ser del banco y el código sea de verdad. Ese código autoriza operaciones; el banco no necesita que se lo digas, porque fue él quien lo mandó.'

const SUMMARY = 'Alguien dice ser del banco y pide que le reenvíes el código que acaba de llegarte.'

const CONTEXT: Context = {
  antes: 'Tienes la app del banco instalada y la usas de vez en cuando para revisar el saldo.',
  ahora: (
    <>
      <strong>Mientras cenas</strong> te llegan dos mensajes casi seguidos: uno con un{' '}
      <strong>código de verificación</strong> y otro de alguien que dice ser del banco.
    </>
  ),
}

function ForwardedCode() {
  return (
    <ScenarioStory
      escenarioId="smishing/codigo-reenviado"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      senales={SIGNALS}
      rule={RULE}
      restartLabel="↻ Repetir el escenario"
      accionesEnPantalla
      apps={APPS}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Actúa sobre el teléfono como lo harías con el tuyo: puedes usar{' '}
          <strong>cualquier parte de él</strong>, incluidas las apps de abajo y las otras
          conversaciones.
        </p>
      }
      pista={
        <p>
          Te llegaron dos mensajes, no uno: el otro está en la lista de conversaciones, saliendo
          del hilo con la flecha de arriba. Puedes contestar a quien te escribe, leer el otro, o
          comprobar en la app si ese intento de acceso existe.
        </p>
      }
    />
  )
}

export default ForwardedCode
