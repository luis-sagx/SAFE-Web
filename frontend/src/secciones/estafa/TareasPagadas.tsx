import { Camera, ListChecks, MessageCircle, Wallet } from 'lucide-react'
import StoryEscenario, { type AppTelefono, type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import { CUENTA_FICTICIA, IDENTIDAD_FICTICIA } from '../../lib/identidadFicticia'

/**
 * Trabajo desde casa: te pagan de verdad, y por eso funciona.
 *
 * El engaño no está en ninguna pantalla, está en el orden de los hechos. Las
 * primeras tareas se pagan puntualmente y con eso compran algo que ninguna
 * mentira compra: la prueba, vivida por ti, de que esto sí paga. Solo después
 * aparece la vuelta de tuerca, que es la única que importa: para seguir
 * ganando hay que poner dinero propio.
 *
 * Se parece al de la inversión garantizada, pero la puerta de entrada es
 * distinta y toca a otra gente: aquí no hace falta tener ahorros, solo falta
 * de trabajo. Por eso entra por un grupo de empleo y no por uno de finanzas.
 */

const COORDINADORA = 'Katty · Coordinadora'
const NUMERO_COORDINADORA = '+593 98 613 9042'
const CUENTA_PLATAFORMA = '6640-7723-19 · Diana Carolina Chuquín'

const FELICITA = {
  text: '¡Felicidades! 🎉 completó sus 20 tareas del nivel Bronce y ya le transferimos sus $12. Revise su cuenta. Está lista para pasar al nivel Plata, donde cada tarea paga $3 en vez de $0,60.',
  time: '15:02',
  senal: 'primer-pago',
}

const CHAT: ScreenView = {
  kind: 'sms',
  sender: COORDINADORA,
  sub: `${NUMERO_COORDINADORA} · coordinadora del grupo de tareas`,
  msgs: [FELICITA],
  respuestas: [
    {
      texto: 'Sí me llegó, gracias. ¿Cómo paso a Plata?',
      goto: 'n2',
      label: 'Preguntó cómo subir de nivel tras recibir el primer pago',
    },
    {
      texto: '¿Por qué me pagan por dar me gusta?',
      goto: 'n2b',
      label: 'Preguntó de dónde salía el dinero de las tareas',
    },
  ],
  volverGoto: 'e_ignora',
  volverLabel: 'Salió del chat sin seguir',
}

const PIDE_RECARGA: ScreenView = {
  ...CHAT,
  msgs: [
    FELICITA,
    { text: 'Sí me llegó, gracias. ¿Cómo paso a Plata?', time: '15:04', mine: true },
    {
      text: 'Muy fácil: el nivel Plata pide un depósito de activación de $180 🔓 ese dinero es suyo, queda como saldo de trabajo en su panel y lo recupera con las primeras 60 tareas. En una semana ya está ganando $180 semanales.',
      time: '15:05',
      senal: 'recarga',
    },
  ],
  respuestas: [
    {
      texto: 'Listo, ¿a qué cuenta deposito?',
      goto: 'n3',
      label: 'Aceptó pagar el depósito de activación',
    },
    {
      texto: 'Un trabajo no se paga para poder trabajar.',
      goto: 'n4',
      label: 'Cuestionó que hubiera que pagar para poder trabajar',
    },
  ],
}

const EXPLICA: ScreenView = {
  ...CHAT,
  msgs: [
    FELICITA,
    { text: '¿Por qué me pagan por dar me gusta?', time: '15:04', mine: true },
    {
      text: 'Porque las marcas nos contratan para posicionar sus productos y nosotros repartimos ese presupuesto entre nuestros colaboradores 📈 usted ya vio que el pago es real, ¿no? Lo del nivel Plata es solo la activación, $180 que quedan como saldo suyo.',
      time: '15:06',
      senal: 'recarga',
    },
  ],
  respuestas: [
    {
      texto: 'Tiene lógica. ¿A qué cuenta deposito?',
      goto: 'n3',
      label: 'Se convenció con la explicación y aceptó depositar',
    },
    {
      texto: 'Un trabajo no se paga para poder trabajar.',
      goto: 'n4',
      label: 'Cuestionó que hubiera que pagar para poder trabajar',
    },
  ],
}

const CUENTA: ScreenView = {
  ...CHAT,
  msgs: [
    FELICITA,
    { text: 'Listo, ¿a qué cuenta deposito?', time: '15:07', mine: true },
    {
      text: `Deposite los $180 a esta cuenta: ${CUENTA_PLATAFORMA}, y mándeme el comprobante para activarle el nivel de una vez 🙌 hoy es el último día de la promoción de activación, mañana sube a $250.`,
      time: '15:08',
      senal: 'cuenta',
    },
  ],
  respuestas: [
    {
      texto: 'Ya mismo deposito.',
      goto: 'n5',
      label: 'Fue a depositar el dinero de la activación',
    },
    {
      texto: 'Primero quiero sacar los $12 que tengo en el panel.',
      goto: 'n6',
      label: 'Intentó retirar lo que tenía antes de poner más',
    },
  ],
}

const INSISTE: ScreenView = {
  ...CHAT,
  msgs: [
    FELICITA,
    { text: 'Un trabajo no se paga para poder trabajar.', time: '15:09', mine: true },
    {
      text: 'No es un pago, es un saldo de trabajo que sigue siendo suyo 🙂 en el grupo somos 300 y todos pasamos por lo mismo. Doña Elsa entró hace dos meses y ya saca $600 al mes desde su casa. Usted decide, pero el cupo de hoy se cierra a las 6.',
      time: '15:10',
      senal: 'grupo',
    },
  ],
  respuestas: [
    {
      texto: 'Bueno, si todos lo hicieron... deme la cuenta.',
      goto: 'n3',
      label: 'Cedió a la presión del grupo y pidió la cuenta',
    },
    {
      texto: 'No voy a poner dinero para trabajar. Hasta aquí.',
      goto: 'e_corta',
      label: 'Se negó a pagar por trabajar y cortó',
    },
  ],
}

const PANEL: ScreenView = {
  kind: 'web',
  app: 'TaskPro',
  url: 'taskpro-ec.app',
  secure: true,
  brand: 'Tu panel',
  title: 'Nivel Bronce',
  subtitle: '20 de 20 tareas completadas.',
  datos: [
    { etiqueta: 'Ganado este mes', valor: '$12,00 · ya transferido', senal: 'primer-pago' },
    { etiqueta: 'Saldo en el panel', valor: '$0,00' },
    {
      etiqueta: 'Nivel Plata',
      valor: 'Bloqueado · requiere depósito de activación de $180',
      senal: 'recarga',
    },
    { etiqueta: 'Colaboradores activos', valor: '2.940' },
  ],
  opciones: [
    {
      texto: 'Ver las condiciones del nivel Plata',
      detalle: 'Qué incluye la activación',
      goto: 'n6b',
      label: 'Leyó las condiciones del nivel de pago',
    },
    { texto: 'Invitar a un conocido', detalle: 'Gana $5 por cada uno que se active' },
    { texto: 'Mis tareas', detalle: 'Historial de los últimos 30 días' },
  ],
  cerrarGoto: 'n1',
  cerrarLabel: 'Volvió al chat desde el panel de tareas',
  fields: [],
  button: '',
}

/// Las condiciones, que están escritas y nadie lee. Dicen en su propia letra
/// pequeña que el depósito no se devuelve y que el retiro depende de completar
/// un cupo que se puede cambiar en cualquier momento.
const CONDICIONES: ScreenView = {
  kind: 'web',
  app: 'TaskPro',
  url: 'taskpro-ec.app',
  secure: true,
  brand: 'Nivel Plata',
  title: 'Condiciones de la activación',
  subtitle: 'Léelas antes de depositar.',
  datos: [
    {
      etiqueta: 'Depósito de activación',
      valor: '$180,00 · no reembolsable en ningún caso',
      senal: 'letra-chica',
    },
    {
      etiqueta: 'Retiro de ganancias',
      valor: 'Se habilita al completar el cupo mensual de tareas asignadas',
      senal: 'letra-chica',
    },
    {
      etiqueta: 'Cupo de tareas',
      valor: 'La plataforma puede modificarlo sin previo aviso',
      senal: 'letra-chica',
    },
    { etiqueta: 'Empresa responsable', valor: 'No consta', senal: 'sin-empresa' },
  ],
  aviso:
    'Al depositar aceptas que la asignación de tareas y el cupo mensual quedan a criterio de la plataforma.',
  cerrarGoto: 'n6',
  cerrarLabel: 'Volvió al panel después de leer las condiciones',
  fields: [],
  button: '',
}

const TRANSFERENCIA: ScreenView = {
  kind: 'web',
  app: IDENTIDAD_FICTICIA.banco,
  url: 'bancolitoral.ec',
  secure: true,
  brand: 'Transferir a terceros',
  title: 'Confirma la transferencia',
  subtitle: `Desde ${CUENTA_FICTICIA}`,
  datos: [
    { etiqueta: 'Cuenta de destino', valor: CUENTA_PLATAFORMA, senal: 'cuenta' },
    { etiqueta: 'Concepto', valor: 'Activación nivel Plata' },
    { etiqueta: 'Valor', valor: '$180,00' },
  ],
  aviso: 'Las transferencias enviadas no se pueden reversar.',
  button: 'Transferir $180,00',
  botonGoto: 'e_recarga',
  botonLabel: 'Pagó $180 para poder seguir trabajando',
  cerrarGoto: 'n3',
  cerrarLabel: 'Volvió atrás sin transferir',
  fields: [],
}

const APPS: AppTelefono[] = [
  { Icono: MessageCircle, texto: 'Mensajes', color: '#2f9e44', hilo: 'sms' },
  {
    Icono: ListChecks,
    texto: 'TaskPro',
    color: '#f08c00',
    goto: 'n6',
    label: 'Abrió el panel de la plataforma de tareas',
  },
  {
    Icono: Wallet,
    texto: IDENTIDAD_FICTICIA.banco,
    color: '#155e75',
    goto: 'n5',
    label: 'Abrió la app del banco para transferir',
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
  n2: { kind: 'scene', view: PIDE_RECARGA },
  n2b: { kind: 'scene', view: EXPLICA },
  n3: { kind: 'scene', view: CUENTA },
  n4: { kind: 'scene', view: INSISTE },
  n5: { kind: 'scene', view: TRANSFERENCIA },
  n6: { kind: 'scene', view: PANEL },
  n6b: { kind: 'scene', view: CONDICIONES },
  e_recarga: {
    kind: 'bad',
    view: TRANSFERENCIA,
    verdict: 'Caíste en la estafa',
    outcome:
      'Los $180 salieron y el nivel Plata se activó. Hiciste las 60 tareas de la primera semana y, al pedir el retiro, el cupo mensual había subido a 200: las condiciones decían que se podía cambiar sin avisar. Después vino el nivel Oro, con otro depósito, "para desbloquear el retiro acumulado". Los $12 del principio fueron lo que costó comprarte, y salieron del bolsillo de alguien que había recargado antes que tú.',
  },
  e_corta: {
    kind: 'good',
    view: INSISTE,
    verdict: 'No caíste · no pagaste por trabajar',
    outcome:
      'Te quedaste con tus $12 y no pusiste un dólar. El grupo cerró siete semanas después, cuando dejaron de aparecer personas nuevas que recargaran: ahí es donde estaba el dinero, y no en ninguna marca. Un trabajo de verdad te paga a ti; el que te cobra por dejarte trabajar no es un trabajo.',
  },
  e_ignora: {
    kind: 'partial',
    view: CHAT,
    verdict: 'No pusiste nada, pero quedaste dentro',
    outcome:
      'Dejaste de contestar y no depositaste, que es lo que importaba. Pero sigues en el grupo, y a la semana siguiente la coordinadora volvió con una promoción de activación más barata. Sin saber por qué el trato estaba mal, la segunda oferta te va a encontrar igual de desprevenido.',
    score: 50,
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'recarga',
    pantalla: 'n2',
    texto:
      'Para trabajar más hay que <b>poner dinero propio</b>. Ahí termina el trabajo y empieza la estafa: ningún empleo de verdad te cobra por dejarte trabajar, se llame activación, membresía o saldo.',
  },
  {
    id: 's2',
    targetId: 'primer-pago',
    pantalla: 'n1',
    texto:
      'Los <b>primeros $12 sí llegaron</b>, y son lo más caro que hace el estafador. No prueban que el trabajo exista: compran la certeza, vivida por ti, de que esto sí paga.',
  },
  {
    id: 's3',
    targetId: 'letra-chica',
    pantalla: 'n6b',
    texto:
      'Las condiciones lo dicen: el depósito <b>no se devuelve</b> y el cupo de tareas <b>se puede cambiar sin avisar</b>. Con esas dos frases el retiro nunca llega a habilitarse.',
  },
  {
    id: 's4',
    targetId: 'grupo',
    pantalla: 'n4',
    texto:
      'Doña Elsa y los <b>trescientos del grupo</b> son la presión que sustituye a la prueba. Que mucha gente haya entrado no dice que funcione: dice de dónde sale el dinero que se reparte.',
  },
  {
    id: 's5',
    targetId: 'sin-empresa',
    pantalla: 'n6b',
    texto:
      'No consta <b>ninguna empresa responsable</b>, y las marcas que supuestamente pagan no aparecen por ningún lado. Sin empresa no hay contrato, ni reclamo, ni a quién buscar.',
  },
  {
    id: 's6',
    targetId: 'cuenta',
    pantalla: 'n3',
    texto:
      'El depósito va a la <b>cuenta personal de una señora</b>, no a la de una empresa. Ninguna compañía que contrata gente cobra a nombre propio.',
  },
]

const RULE =
  'Regla de oro: un trabajo de verdad <b>te paga a ti; tú no le pagas a él</b>. En cuanto haya que depositar para activar un nivel, desbloquear tareas o liberar un retiro, ahí se acabó el trabajo. Que los primeros pagos lleguen es parte del método, no una prueba de que sea real.'

const RESUMEN = 'Un trabajo desde casa que sí te pagó las primeras tareas y ahora pide un depósito.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Llevas meses buscando algo que hacer desde la casa y te metieron en un{' '}
      <strong>grupo de tareas pagadas</strong>: dar me gusta, seguir cuentas, ver videos.
    </>
  ),
  ahora: (
    <>
      <strong>Esta tarde</strong> terminaste las 20 tareas del primer nivel y te llegaron los $12
      prometidos, puntuales, a tu cuenta.
    </>
  ),
  detalle: 'El pago llegó de verdad, y lo puedes ver en tu banco.',
}

function TareasPagadas() {
  return (
    <StoryEscenario
      escenarioId="estafa/tareas-pagadas"
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
          Actúa sobre el teléfono como lo harías con el tuyo: contéstale a la coordinadora y usa{' '}
          <strong>cualquier app de abajo</strong>. Los primeros $12 sí te llegaron.
        </p>
      }
      pista={
        <p>
          Puedes seguirle la conversación, abrir el panel de tareas, leer las condiciones del nivel
          de pago o ir directo a depositar. Fíjate en quién le paga a quién.
        </p>
      }
    />
  )
}

export default TareasPagadas
