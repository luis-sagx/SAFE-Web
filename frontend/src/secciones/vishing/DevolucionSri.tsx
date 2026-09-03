import { Camera, Compass, MessageSquareText, Phone, Wallet } from "lucide-react";
import StoryEscenario, {
  type AppTelefono,
  type ScreenNode,
} from "../../components/StoryEscenario";
import type { Contexto } from "../../components/ui/ContextoEscenario";
import type { ScreenView } from "../../components/ui/DeviceScreen";
import type { Senal } from "../../components/ui/PanelVeredicto";
import type { Story } from "../../hooks/useStoryEngine";
import {
  CUENTA_FICTICIA,
  IDENTIDAD_FICTICIA,
} from "../../lib/identidadFicticia";

/**
 * La devolución de impuestos que hay que "confirmar".
 *
 * El anzuelo no es una amenaza sino un regalo pequeño y creíble, y lo que
 * piden al principio no parece grave: la cédula, el número de cuenta. Por eso
 * el escenario separa lo que se llegó a decir de lo que no — colgar después de
 * dar la cédula no es lo mismo que colgar antes, y el final tiene que
 * distinguirlo o la lección se pierde.
 *
 * El código que piden al final es auténtico y llega solo, en cuanto lo
 * mencionan: es el que el banco manda para autorizar una salida de dinero, no
 * para liberar ningún depósito. La confusión entre las dos cosas es la trampa
 * entera.
 */

const NUMERO = "+593 2 299 0100";
const CODIGO = "302774";

const ENTRANTE: ScreenView = {
  kind: "call",
  entrante: true,
  quien: NUMERO,
  numero: "Quito, Ecuador",
  etiqueta: "No está en tus contactos",
  senalQuien: "quien",
  contestarGoto: "n2",
  contestarLabel: "Contestó la llamada",
  rechazarGoto: "e_rechaza",
  rechazarLabel: "Rechazó la llamada sin contestar",
};

const APERTURA = [
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
  quien: NUMERO,
  numero: "Quito, Ecuador",
  etiqueta: "No está en tus contactos",
  senalQuien: "quien",
  dialogo: APERTURA,
  decir: [
    {
      texto: `Claro, es ${IDENTIDAD_FICTICIA.cedula}.`,
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

const CIERRE = [
  {
    texto: `Perfecto. La acreditación va a la cuenta ${CUENTA_FICTICIA}, ¿es correcta? Ya la tengo aquí en el sistema.`,
    senal: "cuenta",
  },
  {
    texto:
      "Para liberar el depósito su banco le va a enviar un código de seis dígitos. Léamelo en cuanto le llegue y en veinticuatro horas tiene el dinero.",
    senal: "piden-codigo",
  },
];

const DIO_CEDULA: ScreenView = {
  ...BASE,
  dialogo: [
    ...APERTURA,
    { texto: `Claro, es ${IDENTIDAD_FICTICIA.cedula}.`, mio: true },
    ...CIERRE,
  ],
  decir: [
    {
      texto: `Sí, esa es. El código es ${CODIGO}.`,
      goto: "e_codigo",
      label: "Dictó el código que le llegó del banco",
    },
  ],
  colgarGoto: "e_cuelga_datos",
  colgarLabel: "Colgó después de haber dado su cédula",
};

const SIN_CEDULA: ScreenView = {
  ...BASE,
  dialogo: [
    ...APERTURA,
    {
      texto: "Yo no he reclamado ninguna devolución.",
      mio: true,
    },
    {
      texto:
        "Es automática, sale del cruce de sus gastos deducibles. No tiene que reclamar nada, solo confirmarme la cédula y la cuenta donde le depositamos.",
      senal: "insisten",
    },
    ...CIERRE,
  ],
  decir: [
    {
      texto: `Bueno, mi cédula es ${IDENTIDAD_FICTICIA.cedula} y la cuenta es esa.`,
      goto: "e_datos",
      label: "Terminó dando la cédula y confirmando la cuenta",
    },
  ],
  colgarGoto: "e_cuelga",
  colgarLabel: "Colgó sin dar ningún dato",
};

/// El mensaje auténtico. Sin `volverGoto`: no hay lista a la que volver, y la
/// vuelta a la llamada es el icono `Teléfono`, que restaura la conversación
/// exacta donde se dejó.
const CODIGO_SMS: ScreenView = {
  kind: "sms",
  sender: "BancoLitoral",
  sub: "Remitente verificado · SMS",
  msgs: [
    {
      text: `Su codigo de autorizacion de transferencia es ${CODIGO}. Vence en 5 minutos. Nunca lo comparta: con el se autorizan salidas de dinero de su cuenta.`,
      time: "10:12",
      senal: "texto-codigo",
    },
  ],
};

const NAVEGADOR: ScreenView = {
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

const APPS: AppTelefono[] = [
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

/// Llega en cuanto lo mencionan, sobre la llamada en curso, y es la misma en
/// los dos caminos: con cédula dada o sin darla, el código se pide igual.
const NOTIFICACION_CODIGO = {
  app: "Mensajes",
  remitente: "BancoLitoral",
  hora: "10:12",
  texto: `Su codigo de autorizacion de transferencia es ${CODIGO}. Vence en 5 minutos. Nunca lo comparta: con el se autorizan salidas de dinero de su cuenta.`,
  goto: "n_codigo",
  label: "Abrió la notificación del código que envió el banco",
};

export const STORY: Story<ScreenNode> = {
  n1: { kind: "scene", view: ENTRANTE },
  n2: { kind: "scene", view: BASE },
  n3: { kind: "scene", view: DIO_CEDULA, notificacion: NOTIFICACION_CODIGO },
  n3b: { kind: "scene", view: SIN_CEDULA, notificacion: NOTIFICACION_CODIGO },
  n4: { kind: "scene", view: NAVEGADOR },
  n_codigo: { kind: "scene", view: CODIGO_SMS },
  e_rechaza: {
    kind: "good",
    view: ENTRANTE,
    verdict: "No caíste · no contestaste",
    outcome:
      "Rechazaste una llamada de un número desconocido. Si el SRI tuviera algo que devolverte, estaría en tu portal y llegaría por escrito: ninguna institución resuelve un trámite en una llamada que empezaron ellos.",
  },
  e_cuelga: {
    kind: "good",
    view: SIN_CEDULA,
    verdict: "No caíste · colgaste sin dar nada",
    outcome:
      'Colgaste sin confirmar ni un dato. Fíjate en el orden: primero te ofrecen algo bueno, después te piden "solo confirmar" lo que ya deberían saber. Quien de verdad tiene tu declaración no necesita que le dictes tu cédula.',
  },
  e_cuelga_datos: {
    kind: "partial",
    view: DIO_CEDULA,
    verdict: "Colgaste a tiempo, pero ya habías dado tu cédula",
    outcome: `Colgaste antes de dictar el código, que es lo que habría costado dinero. Pero les confirmaste tu cédula ${IDENTIDAD_FICTICIA.cedula}: con ella la próxima llamada sonará mucho más creíble, porque empezarán diciéndotela ellos.`,
    score: 50,
  },
  e_datos: {
    kind: "partial",
    view: SIN_CEDULA,
    verdict: "Dudaste, pero entregaste igual",
    outcome: `Preguntaste bien y aun así acabaste dando tu cédula y confirmando tu cuenta ${CUENTA_FICTICIA}. No perdiste dinero hoy, pero ahora tienen los dos datos con los que se abre cualquier gestión a tu nombre.`,
    score: 50,
  },
  e_codigo: {
    kind: "bad",
    view: DIO_CEDULA,
    verdict: "Caíste en la trampa",
    outcome: `No había ninguna devolución. El código ${CODIGO} no liberaba ningún depósito: era el que tu banco envía para autorizar una transferencia, y con él sacaron el dinero de tu cuenta mientras seguías al teléfono. `,
  },
  e_portal: {
    kind: "good",
    view: PORTAL,
    verdict: "No caíste · lo comprobaste en el portal",
    outcome:
      "En el portal del SRI no había ninguna devolución a tu favor ni trámite en curso, y ahí mismo estaba escrito que no llaman a pedir cuentas ni códigos. Entrar tú al sitio oficial cuesta medio minuto y no depende de nadie.",
  },
};

const SENALES: Senal[] = [
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

const RESUMEN =
  "Una llamada dice que el SRI tiene una devolución de impuestos a tu favor.";

const CONTEXTO: Contexto = {
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

function DevolucionSri() {
  return (
    <StoryEscenario
      escenarioId="vishing/devolucion-sri"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
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

export default DevolucionSri;
