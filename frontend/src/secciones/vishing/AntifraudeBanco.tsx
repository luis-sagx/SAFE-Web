import { Images, MessageSquareText, Phone, Wallet } from "lucide-react";
import ScenarioStory, {
  type PhoneApp,
  type ScreenNode,
} from "../../components/StoryEscenario";
import type { Context } from "../../components/ui/ContextoEscenario";
import type { ScreenView } from "../../components/ui/DeviceScreen";
import type { Signal } from "../../components/ui/PanelVeredicto";
import type { Story } from "../../hooks/useStoryEngine";
import { IDENTITY_FAKE } from "../../lib/identidadFicticia";

// Pareja de tarjeta-bloqueada, al revés: aquí la llamada te empuja a leer un
// SMS auténtico del banco. El mensaje pasa cualquier chequeo; lo falso es
// quien lo pide.

const NUMBER = "+593 2 380 4412";
const WHO = "Banco del Litoral";
const CODE = "480913";

const INCOMING: ScreenView = {
  kind: "call",
  entrante: true,
  quien: NUMBER,
  numero: "Quito, Ecuador",
  etiqueta: "No está en tus contactos",
  senalQuien: "quien",
  contestarGoto: "n2",
  contestarLabel: "Contestó la llamada",
  rechazarGoto: "e_rechaza",
  rechazarLabel: "Rechazó la llamada sin contestar",
};

const OPENING = [
  {
    texto: `Buenas noches, le habla Andrés Villamar del departamento de seguridad del ${WHO}. ¿Hablo con el titular de la tarjeta terminada en ${IDENTITY_FAKE.tarjeta}?`,
    senal: "llaman",
  },
  {
    texto:
      "Le llamo porque detectamos un consumo de ochocientos noventa dólares en una tienda de electrónica de Guayaquil, hecho hace ocho minutos. ¿Ese consumo lo reconoce usted?",
  },
];

const CALL: ScreenView = {
  kind: "call",
  quien: NUMBER,
  numero: "Quito, Ecuador",
  etiqueta: "No está en tus contactos",
  senalQuien: "quien",
  dialogo: OPENING,
  decir: [
    {
      texto: "No, yo no hice esa compra.",
      goto: "n3",
      label: "Dijo que no reconocía el consumo",
    },
    {
      texto: "¿Y cómo sé yo que usted es del banco?",
      goto: "n3b",
      label: "Preguntó cómo saber que quien llama es del banco",
    },
  ],
  colgarGoto: "e_cuelga",
  colgarLabel: "Colgó al principio de la llamada",
};

const DO_NOT_RECOGNIZE = "No, yo no hice esa compra.";
const WHO_IS_IT = "¿Y cómo sé yo que usted es del banco?";

const ASKS_CODE = [
  {
    texto: `Para autorizar la anulación le acabo de enviar un código de seis dígitos por mensaje. Léamelo, por favor.`,
    senal: "piden-codigo",
  },
  {
    texto:
      "Y no cuelgue: si corta la llamada el cargo se ejecuta y ya no lo podemos detener.",
    senal: "no-cuelgue",
  },
];

function askingCode(
  response: { texto: string; mio?: boolean }[],
): ScreenView {
  return {
    kind: "call",
    quien: NUMBER,
    numero: "Quito, Ecuador",
    etiqueta: "No está en tus contactos",
    senalQuien: "quien",
    dialogo: [...OPENING, ...response, ...ASKS_CODE],
    decir: [
      {
        texto: `Ya me llegó: es ${CODE}.`,
        goto: "e_dicta",
        label: "Dictó por teléfono el código que le llegó",
      },
      {
        texto: "Deme un momento, voy a mirar el mensaje.",
        goto: "n4",
        label: "Fue a leer el mensaje antes de contestar",
      },
    ],
    colgarGoto: "e_cuelga",
    colgarLabel: "Colgó cuando le pidieron el código",
  };
}

const NOTIFICATION_CODE = {
  app: "Mensajes",
  remitente: "BancoLitoral",
  hora: "21:07",
  texto: `Su código de autorización es ${CODE}. Vence en 5 minutos. El Banco del Litoral nunca le pedirá este código por teléfono ni por mensaje: si alguien se lo pide, cuelgue.`,
  goto: "n4",
  label: "Abrió la notificación del código que envió el banco",
};

const DENIES_CONSUMPTION = askingCode([
  { texto: DO_NOT_RECOGNIZE, mio: true },
  {
    texto:
      "Entendido, lo marco como consumo no reconocido. Lo anulamos ahora mismo desde aquí, antes de que se liquide.",
  },
]);

const QUESTIONS_IDENTITY = askingCode([
  { texto: WHO_IS_IT, mio: true },
  {
    texto:
      "Es una pregunta muy sensata. Puede comprobar que este número aparece en la página del banco. Vamos a anular el cargo ahora mismo desde aquí.",
  },
]);

const MESSAGE: ScreenView = {
  kind: "sms",
  sender: "BancoLitoral",
  sub: "Remitente verificado · mismo hilo de siempre",
  msgs: [
    {
      text: "Banco del Litoral: consumo aprobado $18,75 PANADERÍA LA ESPIGA 02/08 08:41, tarjeta *4417.",
      time: "08:41",
    },
    {
      text: `Su código de autorización es <b>${CODE}</b>. Vence en 5 minutos. El Banco del Litoral nunca le pedirá este código por teléfono ni por mensaje: si alguien se lo pide, cuelgue.`,
      time: "21:07",
      senal: "texto-codigo",
    },
  ],
};

const BANK: ScreenView = {
  kind: "web",
  app: "Banco del Litoral",
  url: "bancolitoral.ec",
  secure: true,
  brand: "Banca móvil",
  title: `Tarjeta *${IDENTITY_FAKE.tarjeta}`,
  subtitle: "Cupo disponible $1.240,00",
  opciones: [
    {
      texto: "Movimientos",
      detalle: "Consumos y débitos de los últimos 30 días",
      goto: "e_app",
      label: "Revisó los movimientos de la tarjeta en la app",
    },
    {
      texto: "Bloquear tarjeta",
      detalle: "Anula la tarjeta de forma inmediata",
      goto: "e_bloquea",
      label: "Bloqueó la tarjeta sin revisar antes los movimientos",
    },
    { texto: "Transferir", detalle: "A cuentas propias o de terceros" },
    { texto: "Pagar servicios", detalle: "Luz, agua, teléfono e internet" },
  ],
  fields: [],
  button: "",
};

const TRANSACTIONS: ScreenView = {
  kind: "web",
  app: "Banco del Litoral",
  url: "bancolitoral.ec",
  secure: true,
  brand: `Movimientos · Tarjeta *${IDENTITY_FAKE.tarjeta}`,
  title: "Últimos consumos",
  subtitle: "Actualizado hace unos segundos.",
  datos: [
    { etiqueta: "02/08 08:41 · PANADERÍA LA ESPIGA", valor: "$18,75" },
    { etiqueta: "01/08 · Débito automático, internet", valor: "$28,00" },
    { etiqueta: "Consumos en revisión", valor: "Ninguno", senal: "sin-cargo" },
  ],
  aviso:
    "Si no reconoces un consumo, bloquea la tarjeta desde aquí o llama al 1700 123 456, el número impreso en el reverso. Nunca te pediremos por teléfono el código que te enviamos.",
  fields: [],
  button: "",
};

const APPS: PhoneApp[] = [
  { Icono: Phone, texto: "Teléfono", color: "#2f9e44", hilo: "call" },
  {
    Icono: MessageSquareText,
    texto: "Mensajes",
    color: "#1971c2",
    viewNode: "n4",
    label: "Abrió los mensajes para leer el código",
  },
  {
    Icono: Wallet,
    texto: "Banco del Litoral",
    color: "#0f3d6e",
    viewNode: "n5",
    label: "Abrió la app del banco durante la llamada",
  },
  { Icono: Images, texto: "Galería", color: "#c2410c", relleno: "galeria" },
];

export const STORY: Story<ScreenNode> = {
  n1: { kind: "scene", view: INCOMING },
  n2: { kind: "scene", view: CALL },
  n3: { kind: "scene", view: DENIES_CONSUMPTION, notificacion: NOTIFICATION_CODE },
  n3b: { kind: "scene", view: QUESTIONS_IDENTITY, notificacion: NOTIFICATION_CODE },
  n4: { kind: "scene", view: MESSAGE },
  n5: { kind: "scene", view: BANK },
  e_rechaza: {
    kind: "partial",
    view: INCOMING,
    verdict: "No entregaste nada, pero te quedaste con la duda",
    outcome:
      "No contestar evita el daño de la llamada, pero no viste el mensaje real del banco. Ignorar la llamada no basta: revisa la tarjeta también.",
    score: 50,
  },
  e_cuelga: {
    kind: "good",
    view: DENIES_CONSUMPTION,
    verdict: "No caíste · colgaste",
    outcome:
      "Colgaste sin dictar nada: ningún banco pide ese código por teléfono. Ahora llama tú al número del reverso de tu tarjeta, el único confiable.",
  },
  e_dicta: {
    kind: "bad",
    view: DENIES_CONSUMPTION,
    verdict: "Caíste en la trampa",
    outcome: `El consumo de Guayaquil nunca existió. El código ${CODE} autorizaba la transferencia que hacían ellos mientras hablaban contigo.`,
  },
  e_app: {
    kind: "good",
    view: TRANSACTIONS,
    verdict: "No caíste · lo comprobaste donde consta",
    outcome:
      "En la app no había ningún consumo de $890 ni nada en revisión: ese cargo nunca existió. Comprobarlo mientras la llamada esperaba es justo lo que quien llama trata de impedir.",
  },
  e_bloquea: {
    kind: "partial",
    view: BANK,
    verdict: "Reaccionaste sin comprobar",
    outcome:
      "Bloqueaste la tarjeta por un consumo que nunca existió. No perdiste dinero, pero te quedaste sin tarjeta cuando los movimientos estaban a un toque.",
    score: 50,
  },
};

const SIGNALS: Signal[] = [
  {
    id: "s1",
    targetId: "quien",
    pantalla: "n1",
    texto:
      "<b>No es el número de tu banco</b>, aunque diga Quito. Cualquier número en pantalla se puede falsificar.",
  },
  {
    id: "s2",
    targetId: "llaman",
    pantalla: "n2",
    texto:
      "<b>Te llaman ellos, no tú.</b> Solo marcando tú al número del reverso sabes con quién hablas de verdad.",
  },
  {
    id: "s3",
    targetId: "piden-codigo",
    pantalla: "n3",
    texto:
      "Te piden el <b>código que acabas de recibir</b>. Dictarlo firma la operación que hacen mientras hablas.",
  },
  {
    id: "s4",
    targetId: "texto-codigo",
    pantalla: "n4",
    texto:
      "El mensaje <b>es auténtico y lo advierte él mismo</b>: nunca piden ese código por teléfono.",
  },
  {
    id: "s5",
    targetId: "no-cuelgue",
    pantalla: "n3",
    texto:
      "<b>Insisten en que no cuelgues.</b> Colgar y marcar tú es lo único que rompe el engaño.",
  },
  {
    id: "s6",
    targetId: "sin-cargo",
    pantalla: "e_app",
    texto:
      "En la app <b>no había ningún cargo en revisión</b>. Lo que diga quien llama no cambia el estado real.",
  },
];

const RULE =
  "Regla de oro: el código que llega por mensaje <b>nunca se dicta</b>, ni al banco. Cuelga y llama tú al número del reverso de tu tarjeta.";

const SUMMARY =
  "Una llamada dice ser del banco y avisa de un consumo que no reconoces.";

const CONTEXT: Context = {
  antes: (
    <>
      Cliente del <strong>Banco del Litoral</strong>. Usas esa tarjeta casi a
      diario y hoy solo compraste pan por la mañana.
    </>
  ),
  ahora: (
    <>
      <strong>Ya de noche</strong> suena el teléfono, y casi al mismo tiempo
      vibra un <strong>mensaje nuevo</strong> del banco.
    </>
  ),
};

function BankFraudPrevention() {
  return (
    <ScenarioStory
      escenarioId="vishing/antifraude-banco"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      senales={SIGNALS}
      rule={RULE}
      restartLabel="↻ Recibir la llamada otra vez"
      accionesEnPantalla
      apps={APPS}
      identidad={["tarjeta"]}
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Actúa sobre el teléfono como lo harías con el tuyo: contesta o
          rechaza, cuelga cuando quieras y usa{" "}
          <strong>cualquier app de abajo</strong>, incluso con la llamada
          abierta.
        </p>
      }
      pista={
        <p>
          Puedes no contestar, escuchar y responder, colgar en cualquier
          momento, leer el mensaje que acaba de llegar o comprobar tu tarjeta
          por tu cuenta. La llamada te espera mientras miras: quien llama de
          verdad no tiene problema con eso.
        </p>
      }
    />
  );
}

export default BankFraudPrevention;
