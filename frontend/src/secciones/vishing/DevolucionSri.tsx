import { Camera, Compass, MessageSquareText, Phone, Wallet } from "lucide-react";
import ScenarioStory, {
  type PhoneApp,
  type ScreenNode,
} from "../../components/StoryEscenario";
import type { Context } from "../../components/ui/ContextoEscenario";
import type { ScreenView } from "../../components/ui/DeviceScreen";
import type { Signal } from "../../components/ui/PanelVeredicto";
import type { Story } from "../../hooks/useStoryEngine";
import {
  ACCOUNT_FAKE,
  IDENTITY_FAKE,
} from "../../lib/identidadFicticia";

// El anzuelo es un regalo, no una amenaza. El final distingue colgar antes de
// dar la cédula de colgar después: son cosas distintas y hay que marcarlo.
// El código final es real, pero autoriza salidas de dinero, no depósitos.

const NUMBER = "+593 2 299 0100";
const CODE = "302774";

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
    texto:
      "Buenos días, le llamo del Servicio de Rentas Internas, departamento de devoluciones. ¿Hablo con el contribuyente titular de la declaración del año pasado?",
    senal: "llaman",
  },
  {
    texto:
      "Le tengo una buena noticia: le corresponde una devolución de ciento ochenta y cuatro dólares con sesenta. Para acreditarla necesito confirmar su número de cédula.",
    senal: "piden-cedula",
  },
];

const BASE: ScreenView = {
  kind: "call",
  quien: NUMBER,
  numero: "Quito, Ecuador",
  etiqueta: "No está en tus contactos",
  senalQuien: "quien",
  dialogo: OPENING,
  decir: [
    {
      texto: `Claro, es ${IDENTITY_FAKE.cedula}.`,
      goto: "n3",
      label: "Confirmó su número de cédula por teléfono",
    },
    {
      texto:
        "¿De qué declaración me habla? Yo no he reclamado ninguna devolución.",
      goto: "n3b",
      label: "Preguntó de qué devolución se trata sin dar datos",
    },
  ],
  colgarGoto: "e_cuelga",
  colgarLabel: "Colgó al principio de la llamada",
};

const COMPLETION = [
  {
    texto: `Perfecto. La acreditación va a la cuenta ${ACCOUNT_FAKE}, ¿es correcta? Ya la tengo aquí en el sistema.`,
    senal: "cuenta",
  },
  {
    texto:
      "Para liberar el depósito su banco le va a enviar un código de seis dígitos. Léamelo en cuanto le llegue y en veinticuatro horas tiene el dinero.",
    senal: "piden-codigo",
  },
];

const GAVE_ECUADORIAN_ID: ScreenView = {
  ...BASE,
  dialogo: [
    ...OPENING,
    { texto: `Claro, es ${IDENTITY_FAKE.cedula}.`, mio: true },
    ...COMPLETION,
  ],
  decir: [
    {
      texto: `Sí, esa es. El código es ${CODE}.`,
      goto: "e_codigo",
      label: "Dictó el código que le llegó del banco",
    },
  ],
  colgarGoto: "e_cuelga_datos",
  colgarLabel: "Colgó después de haber dado su cédula",
};

const WITHOUT_ECUADORIAN_ID: ScreenView = {
  ...BASE,
  dialogo: [
    ...OPENING,
    {
      texto: "Yo no he reclamado ninguna devolución.",
      mio: true,
    },
    {
      texto:
        "Es automática, sale del cruce de sus gastos deducibles. No tiene que reclamar nada, solo confirmarme la cédula y la cuenta donde le depositamos.",
      senal: "insisten",
    },
    ...COMPLETION,
  ],
  decir: [
    {
      texto: `Bueno, mi cédula es ${IDENTITY_FAKE.cedula} y la cuenta es esa.`,
      goto: "e_datos",
      label: "Terminó dando la cédula y confirmando la cuenta",
    },
  ],
  colgarGoto: "e_cuelga",
  colgarLabel: "Colgó sin dar ningún dato",
};

// Sin `volverGoto`: se vuelve a la llamada por el icono Teléfono, que
// restaura la conversación exacta donde se dejó.
const CODE_SMS: ScreenView = {
  kind: "sms",
  sender: "BancoLitoral",
  sub: "Remitente verificado · SMS",
  msgs: [
    {
      text: `Su codigo de autorizacion de transferencia es ${CODE}. Vence en 5 minutos. Nunca lo comparta: con el se autorizan salidas de dinero de su cuenta.`,
      time: "10:12",
      senal: "texto-codigo",
    },
  ],
};

const BROWSER: ScreenView = {
  kind: "web",
  app: "Navegador",
  url: "inicio",
  secure: true,
  brand: "Sitios frecuentes",
  title: "Nueva pestaña",
  opciones: [
    { texto: "elcomercio.com", detalle: "Noticias del Ecuador" },
    {
      texto: "sri.gob.ec",
      detalle: "Servicio de Rentas Internas · consultas en línea",
      goto: "e_portal",
      label: "Entró al portal del SRI para comprobar la devolución",
    },
    { texto: "bancolitoral.ec", detalle: "Banca en línea" },
    { texto: "ant.gob.ec", detalle: "Agencia Nacional de Tránsito" },
  ],
  fields: [],
  button: "",
};

const PORTAL: ScreenView = {
  kind: "web",
  url: "https://www.sri.gob.ec/devoluciones",
  secure: true,
  brand: "SRI · Servicio de Rentas Internas",
  title: "Consulta de devoluciones",
  subtitle: "Resultado para la cédula registrada a tu nombre.",
  datos: [
    {
      etiqueta: "Devoluciones a tu favor",
      valor: "Ninguna",
      senal: "sin-devolucion",
    },
    { etiqueta: "Trámites en curso", valor: "Ninguno" },
    {
      etiqueta: "Última declaración",
      valor: "Presentada y sin saldo pendiente",
    },
  ],
  aviso:
    "Las devoluciones se solicitan y se consultan en este portal. El SRI no llama por teléfono para pedir números de cuenta ni códigos de tu banco.",
  fields: [],
  button: "",
};

const APPS: PhoneApp[] = [
  { Icono: Phone, texto: "Teléfono", color: "#2f9e44", hilo: "call" },
  {
    Icono: MessageSquareText,
    texto: "Mensajes",
    color: "#2f9e44",
    goto: "n_codigo",
    label: "Abrió los mensajes para leer el código",
  },
  {
    Icono: Compass,
    texto: "Navegador",
    color: "#1971c2",
    goto: "n4",
    label: "Abrió el navegador para comprobar por su cuenta",
  },
  {
    Icono: Wallet,
    texto: "Banco",
    color: "#155e75",
    vacia: "Banca móvil · Saldo disponible $312,45. Sin notificaciones nuevas.",
  },
  {
    Icono: Camera,
    texto: "Cámara",
    color: "#495057",
    vacia: "La cámara está lista. No hay nada que fotografiar en este momento.",
  },
];

const NOTIFICATION_CODE = {
  app: "Mensajes",
  remitente: "BancoLitoral",
  hora: "10:12",
  texto: `Su codigo de autorizacion de transferencia es ${CODE}. Vence en 5 minutos. Nunca lo comparta: con el se autorizan salidas de dinero de su cuenta.`,
  goto: "n_codigo",
  label: "Abrió la notificación del código que envió el banco",
};

export const STORY: Story<ScreenNode> = {
  n1: { kind: "scene", view: INCOMING },
  n2: { kind: "scene", view: BASE },
  n3: { kind: "scene", view: GAVE_ECUADORIAN_ID, notificacion: NOTIFICATION_CODE },
  n3b: { kind: "scene", view: WITHOUT_ECUADORIAN_ID, notificacion: NOTIFICATION_CODE },
  n4: { kind: "scene", view: BROWSER },
  n_codigo: { kind: "scene", view: CODE_SMS },
  e_rechaza: {
    kind: "good",
    view: INCOMING,
    verdict: "No caíste · no contestaste",
    outcome:
      "Rechazaste una llamada de un número desconocido. Si el SRI tuviera algo que devolverte, estaría en tu portal y llegaría por escrito: ninguna institución resuelve un trámite en una llamada que empezaron ellos.",
  },
  e_cuelga: {
    kind: "good",
    view: WITHOUT_ECUADORIAN_ID,
    verdict: "No caíste · colgaste sin dar nada",
    outcome:
      'Colgaste sin confirmar ni un dato. Fíjate en el orden: primero te ofrecen algo bueno, después te piden "solo confirmar" lo que ya deberían saber. Quien de verdad tiene tu declaración no necesita que le dictes tu cédula.',
  },
  e_cuelga_datos: {
    kind: "partial",
    view: GAVE_ECUADORIAN_ID,
    verdict: "Colgaste a tiempo, pero ya habías dado tu cédula",
    outcome: `Colgaste antes de dictar el código, que es lo que habría costado dinero. Pero les confirmaste tu cédula ${IDENTITY_FAKE.cedula}: con ella la próxima llamada sonará mucho más creíble, porque empezarán diciéndotela ellos.`,
    score: 50,
  },
  e_datos: {
    kind: "partial",
    view: WITHOUT_ECUADORIAN_ID,
    verdict: "Dudaste, pero entregaste igual",
    outcome: `Preguntaste bien y aun así acabaste dando tu cédula y confirmando tu cuenta ${ACCOUNT_FAKE}. No perdiste dinero hoy, pero ahora tienen los dos datos con los que se abre cualquier gestión a tu nombre.`,
    score: 50,
  },
  e_codigo: {
    kind: "bad",
    view: GAVE_ECUADORIAN_ID,
    verdict: "Caíste en la trampa",
    outcome: `No había ninguna devolución. El código ${CODE} no liberaba ningún depósito: era el que tu banco envía para autorizar una transferencia, y con él sacaron el dinero de tu cuenta mientras seguías al teléfono. `,
  },
  e_portal: {
    kind: "good",
    view: PORTAL,
    verdict: "No caíste · lo comprobaste en el portal",
    outcome:
      "En el portal del SRI no había ninguna devolución a tu favor ni trámite en curso, y ahí mismo estaba escrito que no llaman a pedir cuentas ni códigos. Entrar tú al sitio oficial cuesta medio minuto y no depende de nadie.",
  },
};

const SIGNALS: Signal[] = [
  {
    id: "s1",
    targetId: "quien",
    pantalla: "n1",
    texto:
      "Un <b>número cualquiera</b> que dice ser una institución. Que en la pantalla salga un número de Quito no acredita a nadie.",
  },
  {
    id: "s2",
    targetId: "piden-cedula",
    pantalla: "n2",
    texto:
      "Te piden <b>la cédula que ya deberían tener</b>. Si de verdad estuvieran mirando tu declaración, tu cédula estaría delante de ellos: pedirla es la prueba de que no la tienen.",
  },
  {
    id: "s3",
    targetId: "insisten",
    pantalla: "n3b",
    texto:
      '<b>"Es automática, no tiene que reclamar nada."</b> La respuesta a tu duda está preparada: preguntar no molesta a quien está estafando, solo le da una frase más.',
  },
  {
    id: "s4",
    targetId: "cuenta",
    pantalla: "n3",
    texto:
      "Dicen tu cuenta y te piden <b>confirmarla</b>. Confirmar también es entregar: el truco funciona porque parece que ya la sabían.",
  },
  {
    id: "s5",
    targetId: "piden-codigo",
    pantalla: "n3",
    texto:
      'El <b>código del banco no sirve para recibir dinero</b>, solo para autorizar salidas. Cualquiera que te lo pida para "liberar un depósito" está sacándote el dinero, no metiéndotelo.',
  },
  {
    id: "s6",
    targetId: "sin-devolucion",
    pantalla: "e_portal",
    texto:
      "En el portal <b>no había ninguna devolución</b>. Los trámites con el Estado se ven entrando tú, no en una llamada que empezó el otro.",
  },
  {
    id: "s7",
    targetId: "texto-codigo",
    pantalla: "n_codigo",
    texto:
      "El mensaje lo dice en su propio texto: ese código <b>autoriza salidas de dinero</b>, nunca libera un depósito. Es el mismo código, pero no para lo que te dijeron.",
  },
];

const RULE =
  "Regla de oro: ninguna institución te llama para pedirte tu cédula, tu cuenta o un código. Si te ofrecen dinero por teléfono, <b>cuelga y compruébalo entrando tú al portal oficial</b>; y recuerda que el código del banco solo autoriza salidas de dinero, nunca entradas.";

const SUMMARY =
  "Una llamada dice que el SRI tiene una devolución de impuestos a tu favor.";

const CONTEXT: Context = {
  antes: (
    <>
      Declaraste tus impuestos el año pasado, como siempre, y{" "}
      <strong>no reclamaste ninguna devolución</strong>.
    </>
  ),
  ahora: (
    <>
      <strong>Una mañana entre semana</strong> te llama un número desconocido
      diciendo que es del SRI y que tienes dinero a tu favor.
    </>
  ),
};

function SriRefund() {
  return (
    <ScenarioStory
      escenarioId="vishing/devolucion-sri"
      resumen={SUMMARY}
      contexto={CONTEXT}
      story={STORY}
      senales={SIGNALS}
      rule={RULE}
      restartLabel="↻ Recibir la llamada otra vez"
      accionesEnPantalla
      apps={APPS}
      identidad={["cedula", "cuenta"]}
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
          Puedes no contestar, escuchar y responder, colgar en cualquier momento
          o dejar la llamada esperando y comprobar por tu cuenta si esa
          devolución existe. Fíjate en qué te piden y en qué momento.
        </p>
      }
    />
  );
}

export default SriRefund;
