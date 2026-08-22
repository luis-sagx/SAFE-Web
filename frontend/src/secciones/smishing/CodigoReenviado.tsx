import { Compass, MessageSquareText, Phone, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

/**
 * El más difícil del módulo, y por una razón concreta: la mitad de lo que se ve
 * es auténtico.
 *
 * El código llega de verdad, del remitente de siempre del banco, porque el
 * atacante acaba de pedirlo con el número del participante. Todo lo que los
 * otros escenarios enseñan a mirar —el remitente, el formato, la dirección—
 * sale bien en ese mensaje. Lo falso es el otro, el que pide reenviarlo.
 *
 * Por eso el escenario deja las dos conversaciones a mano: el mensaje bueno
 * lleva escrita la defensa ("nunca lo comparta") y leerlo es lo que arma la
 * decisión. Nada obliga a abrirlo, igual que en la vida real.
 */

const CODIGO = '731 640'

const HILO_FALSO: ScreenView = {
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
  // Reenviar es el botín, así que pasa por el campo antes de salir: ver los
  // seis dígitos escritos y todavía sin enviar es el instante que este
  // escenario quiere provocar. Negarse no gana: no darlo evita el daño, pero
  // deja el aviso sin comprobar y a ellos con la conversación abierta.
  respuestas: [
    {
      texto: 'Te reenvío el código.',
      goto: 'n3',
      label: 'Fue a reenviar el código al número desconocido',
    },
    {
      texto: 'Ese código no se lo puedo pasar a nadie.',
      goto: 'e_niega',
      label: 'Se negó a reenviar el código',
    },
  ],
  volverGoto: 'n1',
  volverLabel: 'Volvió a la lista de mensajes',
}

const HILO_BORRADOR: ScreenView = {
  ...HILO_FALSO,
  respuestas: undefined,
  borrador: `Te reenvío el código: ${CODIGO}`,
  senalBorrador: 'reenvio',
  enviarGoto: 'e_reenvia',
  enviarLabel: 'Reenvió el código al número desconocido',
}

/// El hilo con la respuesta ya enviada. Los dos finales que nacen de contestar
/// se ven sobre la burbuja propia: un borrador que se convierte en veredicto
/// sin llegar a salir deja sin enseñar lo único que importaba, que el código
/// salió del teléfono.
const HILO_ENVIADO: ScreenView = {
  ...HILO_BORRADOR,
  borrador: undefined,
  enviarGoto: undefined,
  volverGoto: undefined,
  msgs: [
    ...(HILO_FALSO.kind === 'sms' ? HILO_FALSO.msgs : []),
    { text: `Te reenvío el código: ${CODIGO}`, time: '20:43', mine: true, senal: 'reenvio' },
  ],
}

const HILO_NEGADO: ScreenView = {
  ...HILO_ENVIADO,
  msgs: [
    ...(HILO_FALSO.kind === 'sms' ? HILO_FALSO.msgs : []),
    { text: 'Ese código no se lo puedo pasar a nadie.', time: '20:43', mine: true },
  ],
}

/// La lista de conversaciones, y la pantalla por la que se entra. Abrir
/// Mensajes y ver los dos hilos uno debajo del otro es lo que hace que el
/// código no salga de la nada: su vista previa lo enseña antes de tocar nada,
/// y los dos remitentes quedan a la vista para compararlos. Leer el del banco
/// sigue siendo decisión del participante, como lo sería en su teléfono.
const LISTA: ScreenView = {
  kind: 'web',
  app: 'Mensajes',
  url: 'lista',
  secure: true,
  brand: 'Mensajes',
  title: 'Conversaciones',
  // Salir de Mensajes es dejarlo pasar: no entrega nada y no comprueba nada.
  cerrarGoto: 'e_ignora',
  cerrarLabel: 'Salió de los mensajes sin hacer nada',
  opciones: [
    {
      texto: 'BANCO LITORAL',
      detalle: `Su código de verificación es ${CODIGO}… · 20:40`,
      goto: 'n4',
      label: 'Abrió el mensaje que envió el banco',
    },
    {
      texto: '+593 99 412 8867',
      detalle: 'Para confirmar que es usted y cerrar el caso… · 20:42',
      goto: 'n2',
      label: 'Abrió la conversación del número desconocido',
    },
    { texto: 'Mamá', detalle: '¿Llegaste bien? · ayer' },
    { texto: 'ENVIAEXPRESS', detalle: 'Su envío fue entregado. Gracias por preferirnos. · lun' },
  ],
  fields: [],
  button: '',
}

/// El mensaje auténtico. Todo en él está bien —el remitente de siempre, el
/// formato de siempre— y lleva escrita la defensa. Es el escenario entero en
/// dos líneas.
const HILO_BANCO: ScreenView = {
  kind: 'sms',
  sender: 'BANCO LITORAL',
  sub: 'Remitente habitual · SMS',
  senalRemitente: 'remitente-real',
  msgs: [
    {
      text: `Su codigo de verificacion es ${CODIGO}. Vence en 5 minutos. NUNCA lo comparta con nadie, ni con personal del banco.`,
      time: '20:40',
      senal: 'aviso-real',
    },
  ],
  volverGoto: 'n1',
  volverLabel: 'Volvió a la lista de mensajes',
}

/// El inicio de la banca móvil. Abrir la app todavía no es haber comprobado
/// nada: desde aquí se puede mirar la actividad de la cuenta o cambiar la clave
/// a ciegas, que es el gesto precipitado que este escenario mide. Un icono que
/// resuelve el escenario de un toque premia haber encontrado el icono, no haber
/// sabido qué hacer con él.
const BANCO_INICIO: ScreenView = {
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
      goto: 'e_app',
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
}

const APP_BANCO: ScreenView = {
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
}

const APPS: AppTelefono[] = [
  {
    Icono: Wallet,
    texto: 'Banco',
    color: '#155e75',
    goto: 'n5',
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
  n1: { kind: 'scene', view: LISTA },
  n2: { kind: 'scene', view: HILO_FALSO },
  n3: { kind: 'scene', view: HILO_BORRADOR },
  n4: { kind: 'scene', view: HILO_BANCO },
  n5: { kind: 'scene', view: BANCO_INICIO },
  e_reenvia: {
    kind: 'bad',
    view: HILO_ENVIADO,
    verdict: 'Caíste en la trampa',
    outcome:
      'No había ningún intento de acceso: el que estaba entrando a tu banca era quien te escribía, y le faltaba ese código para terminar. Tu mensaje se lo dio. Transfirieron el saldo a tres cuentas distintas en menos de un minuto, y el código lo enviaste tú, así que la operación quedó registrada como autorizada por ti.',
  },
  e_app: {
    kind: 'good',
    view: APP_BANCO,
    verdict: 'No caíste · lo comprobaste donde consta',
    outcome:
      'No había ningún acceso desde otro dispositivo. Sí había una solicitud de código de hace dos minutos, todavía sin usar: la había pedido quien te escribía, esperando que se lo reenviaras para completarla.',
  },
  e_clave: {
    kind: 'partial',
    view: BANCO_INICIO,
    verdict: 'Cambiaste la clave, pero el código sigue vivo',
    outcome:
      'No reenviaste el código, que es lo único que impedía que entraran. Pero cambiar la clave no cancela la solicitud que ya estaba hecha y sin usar: ese código sigue sirviendo hasta que venza, y tú sigues sin saber si hubo algún acceso. Estaba a un toque, en "Seguridad de la cuenta".',
  },
  e_niega: {
    kind: 'partial',
    view: HILO_NEGADO,
    verdict: 'No lo diste, pero les seguiste contestando',
    outcome:
      'No entregaste el código, que es lo que importaba. Pero le contestaste a un número desconocido, así que ahora saben que la línea está activa y que alguien la lee, y tienen una conversación abierta contigo para insistir mejor. Y no comprobaste nada: la solicitud de ese código sigue hecha y sin usar, esperando.',
  },
  e_ignora: {
    kind: 'partial',
    view: LISTA,
    verdict: 'No lo reenviaste, pero te quedaste con la duda',
    outcome:
      'No diste el código, que es lo único que impedía que entraran. Pero saliste sin comprobar nada, y si el aviso hubiera sido cierto seguirías con alguien intentando entrar a tu cuenta. La duda se resuelve en la app, no dejándola pasar.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'aviso-real',
    pantalla: 'n4',
    texto:
      'El mensaje del banco es <b>auténtico</b>, y lleva la defensa escrita: <b>"nunca lo comparta, ni con personal del banco"</b>. Que el código sea de verdad es justo lo que hace creíble al otro mensaje.',
  },
  {
    id: 's2',
    targetId: 'piden-codigo',
    pantalla: 'n2',
    texto:
      'Dice que el código <b>"es solo de verificación y no autoriza nada"</b>. Es exactamente al revés: ese código autoriza operaciones, y por eso lo quieren.',
  },
  {
    id: 's3',
    targetId: 'remitente',
    pantalla: 'n2',
    texto:
      'Llega de un <b>número de celular cualquiera</b>, no del remitente por el que te escribe siempre tu banco. Compara las dos conversaciones y la diferencia salta.',
  },
  {
    id: 's4',
    targetId: 'reenvio',
    pantalla: 'e_reenvia',
    texto:
      'Reenviar el código es <b>firmar la operación</b> que están haciendo al otro lado. No es identificarte: es autorizar.',
  },
  {
    id: 's5',
    targetId: 'sin-intento',
    pantalla: 'e_app',
    texto:
      'En la app <b>no consta ningún intento de acceso</b>. Lo que sí consta es la solicitud del código, hecha dos minutos antes: la pidieron ellos.',
  },
]

const RULE =
  'Regla de oro: <b>un código que llega a tu teléfono no se reenvía a nadie</b>, ni aunque quien lo pida diga ser del banco y el código sea de verdad. Ese código autoriza operaciones; el banco no necesita que se lo digas, porque fue él quien lo mandó.'

const RESUMEN = 'Alguien dice ser del banco y pide que le reenvíes el código que acaba de llegarte.'

const CONTEXTO: Contexto = {
  antes: 'Tienes la app del banco instalada y la usas de vez en cuando para revisar el saldo.',
  ahora: (
    <>
      <strong>Mientras cenas</strong> te llegan dos mensajes casi seguidos: uno con un{' '}
      <strong>código de verificación</strong> y otro de alguien que dice ser del banco.
    </>
  ),
  detalle: 'No estabas haciendo ninguna operación ni pediste ningún código.',
}

function CodigoReenviado() {
  return (
    <StoryEscenario
      escenarioId="smishing/codigo-reenviado"
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
          Actúa sobre el teléfono como lo harías con el tuyo: puedes usar{' '}
          <strong>cualquier parte de él</strong>, incluidas las apps de abajo y las otras
          conversaciones.
        </p>
      }
      pista={
        <p>
          Te llegaron dos mensajes, no uno. Puedes contestar al que te escribe, leer el otro, o
          comprobar en la app si ese intento de acceso existe. Cuál de ellos es el acertado es
          justamente lo que decides tú.
        </p>
      }
    />
  )
}

export default CodigoReenviado
