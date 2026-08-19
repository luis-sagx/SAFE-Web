import { Camera, Images, Landmark, Phone } from "lucide-react";
import StoryEscenario, {
  type AppTelefono,
  type ScreenNode,
} from "../../components/StoryEscenario";
import type { Contexto } from "../../components/ui/ContextoEscenario";
import type { ScreenView } from "../../components/ui/DeviceScreen";
import type { Senal } from "../../components/ui/PanelVeredicto";
import type { Story } from "../../hooks/useStoryEngine";
import { IDENTIDAD_FICTICIA } from "../../lib/identidadFicticia";

/**
 * El más difícil del módulo: la llamada que no pide dinero.
 *
 * Todo lo que los otros escenarios enseñan a detectar aquí sale bien. No hay
 * urgencia, no hay amenaza, no piden claves ni códigos, y lo que preguntan
 * parece inofensivo. Pero fecha de nacimiento, apellido de la madre, agencia
 * donde abriste la cuenta y últimos dígitos de la tarjeta son exactamente las
 * preguntas con las que un banco comprueba por teléfono que eres tú.
 *
 * La lección no es "cuelga si te apuran": es que los datos que no parecen
 * secretos son los que abren la puerta, y que quien llama no tiene por qué
 * pedírtelos aunque sea amable.
 */

const NUMERO = "+593 4 500 1180";
const NACIMIENTO = "14 de marzo del 78";
const MADRE = "Rosa Elena Cedeño";

const ENTRANTE: ScreenView = {
  kind: "call",
  entrante: true,
  quien: NUMERO,
  numero: "Guayaquil, Ecuador",
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
      "Buenas tardes, le habla Katherine del área de calidad del Banco del Litoral. Estamos haciendo una encuesta de dos minutos sobre la atención en su agencia, ¿me regala un momentito?",
    senal: "amable",
  },
  {
    texto:
      "Gracias. Por participar le exoneramos la comisión de manejo de este mes. Antes de empezar valido que hablo con el titular: ¿me confirma su fecha de nacimiento y el nombre completo de su mamá?",
    senal: "preguntas",
  },
];

const LLAMADA: ScreenView = {
  kind: "call",
  quien: NUMERO,
  numero: "Guayaquil, Ecuador",
  etiqueta: "No está en tus contactos",
  senalQuien: "quien",
  dialogo: APERTURA,
  decir: [
    {
      texto: `${NACIMIENTO}, y mi mamá es ${MADRE}.`,
      goto: "n3",
      label: "Dio su fecha de nacimiento y el nombre de su madre",
    },
    {
      texto: "¿Y para una encuesta necesitan todo eso?",
      goto: "n3b",
      label: "Preguntó por qué una encuesta necesita esos datos",
    },
  ],
  colgarGoto: "e_cuelga",
  colgarLabel: "Colgó sin dar ningún dato",
};

const SIGUE = [
  {
    texto:
      "Perfecto, gracias. Primera pregunta: del uno al cinco, ¿cómo calificaría el tiempo de espera en ventanilla?",
  },
  {
    texto:
      "Anotado. Y para registrarle el beneficio necesito dos datos más: los cuatro últimos dígitos de su tarjeta y la agencia donde abrió la cuenta.",
    senal: "ultimos-datos",
  },
];

/// La encuesta sigue igual se hayan dado los datos a la primera o después de
/// dudar, pero el hilo conserva por dónde se llegó: la conversación que se lee
/// tiene que ser la que se tuvo.
function encuestando(
  previas: { texto: string; mio?: boolean; senal?: string }[],
): ScreenView {
  return {
    kind: "call",
    quien: NUMERO,
    numero: "Guayaquil, Ecuador",
    etiqueta: "No está en tus contactos",
    senalQuien: "quien",
    dialogo: [...APERTURA, ...previas, ...SIGUE],
    decir: [
      {
        texto: `Termina en ${IDENTIDAD_FICTICIA.tarjeta}, y la abrí en la agencia Alborada.`,
        goto: "e_datos",
        label: "Dio los últimos dígitos de la tarjeta y su agencia",
      },
    ],
    colgarGoto: "e_cuelga_datos",
    colgarLabel: "Colgó después de haber dado sus datos personales",
  };
}

const DIO_DATOS = encuestando([
  { texto: `${NACIMIENTO}, y mi mamá es ${MADRE}.`, mio: true },
]);

const CEDIO = encuestando([
  { texto: "¿Y para una encuesta necesitan todo eso?", mio: true },
  {
    texto:
      "Es solo para validar que hablo con el titular de la cuenta, es el protocolo. Si prefiere lo dejamos, aunque el beneficio de la comisión se registra hoy y mañana ya no le puedo ayudar.",
    senal: "protocolo",
  },
  { texto: `Bueno, está bien: ${NACIMIENTO}, mi mamá es ${MADRE}.`, mio: true },
]);

const DUDO: ScreenView = {
  ...LLAMADA,
  dialogo: [
    ...APERTURA,
    { texto: "¿Y para una encuesta necesitan todo eso?", mio: true },
    {
      texto:
        "Es solo para validar que hablo con el titular de la cuenta, es el protocolo. Si prefiere lo dejamos, aunque el beneficio de la comisión se registra hoy y mañana ya no le puedo ayudar.",
      senal: "protocolo",
    },
  ],
  decir: [
    {
      texto: `Bueno, está bien: ${NACIMIENTO}, mi mamá es ${MADRE}.`,
      goto: "n3c",
      label: "Terminó dando sus datos tras la insistencia",
    },
    {
      texto: "No, gracias. Si necesitan algo, ya paso yo por la agencia.",
      goto: "e_niega",
      label: "Se negó a dar datos y ofreció ir a la agencia",
    },
  ],
  colgarGoto: "e_cuelga",
  colgarLabel: "Colgó sin dar ningún dato",
};

const BANCO: ScreenView = {
  kind: "web",
  app: "Banco del Litoral",
  url: "bancolitoral.ec",
  secure: true,
  brand: "Banca móvil",
  title: "Hola de nuevo",
  subtitle: `Tarjeta *${IDENTIDAD_FICTICIA.tarjeta} · cupo disponible $1.240,00`,
  opciones: [
    {
      texto: "Mensajes del banco",
      detalle: "Avisos y campañas dirigidas a ti",
      goto: "e_verifica",
      label: "Consultó en la app si el banco tenía alguna campaña en curso",
    },
    {
      texto: "Movimientos",
      detalle: "Consumos y débitos de los últimos 30 días",
    },
    { texto: "Transferir", detalle: "A cuentas propias o de terceros" },
    { texto: "Mi perfil", detalle: "Datos, límites y notificaciones" },
  ],
  fields: [],
  button: "",
};

const BUZON: ScreenView = {
  kind: "web",
  app: "Banco del Litoral",
  url: "bancolitoral.ec",
  secure: true,
  brand: "Mensajes del banco",
  title: "Tu buzón",
  subtitle: "Actualizado hace unos segundos.",
  datos: [
    {
      etiqueta: "Encuestas o campañas activas",
      valor: "Ninguna",
      senal: "sin-campana",
    },
    { etiqueta: "Beneficios registrados a tu nombre", valor: "Ninguno" },
    { etiqueta: "Último aviso", valor: "Estado de cuenta de julio, 01/08" },
  ],
  aviso:
    "El Banco del Litoral no hace encuestas telefónicas ni te pide datos personales por teléfono. Tus datos de seguridad —fecha de nacimiento, apellidos familiares, agencia y dígitos de tu tarjeta— son los que usamos para identificarte: no los compartas con nadie que te llame.",
  fields: [],
  button: "",
};

const APPS: AppTelefono[] = [
  { Icono: Phone, texto: "Teléfono", color: "#2f9e44", hilo: "call" },
  {
    Icono: Landmark,
    texto: "Banco del Litoral",
    color: "#0f3d6e",
    goto: "n5",
    label: "Abrió la app del banco durante la llamada",
  },
  {
    Icono: Images,
    texto: "Galería",
    color: "#c2410c",
    vacia: "Tus fotos recientes · 248 elementos.",
  },
  {
    Icono: Camera,
    texto: "Cámara",
    color: "#495057",
    vacia: "La cámara está lista. No hay nada que fotografiar en este momento.",
  },
];

export const STORY: Story<ScreenNode> = {
  n1: { kind: "scene", view: ENTRANTE },
  n2: { kind: "scene", view: LLAMADA },
  n3: { kind: "scene", view: DIO_DATOS },
  n3b: { kind: "scene", view: DUDO },
  n3c: { kind: "scene", view: CEDIO },
  n5: { kind: "scene", view: BANCO },
  e_rechaza: {
    kind: "good",
    view: ENTRANTE,
    verdict: "No caíste · no contestaste",
    outcome:
      "No contestaste a un número desconocido. Una encuesta no es urgente ni obligatoria, y tu banco no necesita hacerte preguntas por teléfono: lo que tenga que decirte te lo deja en la app.",
  },
  e_cuelga: {
    kind: "good",
    view: DUDO,
    verdict: "No caíste · colgaste sin dar nada",
    outcome:
      "Colgaste sin soltar un dato. Aunque la llamada fuera de verdad, no pierdes nada: siempre puedes acercarte a la agencia o llamar tú. Y si era falsa, se quedaron sin lo único que buscaban.",
  },
  e_niega: {
    kind: "good",
    view: DUDO,
    verdict: "No caíste · te negaste con calma",
    outcome:
      "Dijiste que no y ofreciste ir tú a la agencia, que es la respuesta perfecta: no hace falta ser brusco ni acusar a nadie. Quien de verdad trabaja en un banco lo entiende; quien está estafando cuelga solo.",
  },
  e_cuelga_datos: {
    kind: "partial",
    view: DIO_DATOS,
    verdict: "Colgaste, pero ya habías dado lo importante",
    outcome: `Cortaste antes de dar lo de la tarjeta. Aun así les dejaste tu fecha de nacimiento y el nombre de tu mamá: son dos de las preguntas con las que el banco comprueba por teléfono que eres tú, y ahora las sabe alguien más.`,
    score: 50,
  },
  e_datos: {
    kind: "bad",
    view: DIO_DATOS,
    verdict: "Caíste en la trampa",
    outcome: `No hubo encuesta ni exoneración. Con tu fecha de nacimiento, el apellido de tu mamá, tu agencia y los últimos dígitos de tu tarjeta llamaron ellos al banco haciéndose pasar por ti: contestaron todas las preguntas de seguridad, pidieron una clave nueva de banca en línea y entraron a tu cuenta. `,
  },
  e_verifica: {
    kind: "good",
    view: BUZON,
    verdict: "No caíste · lo comprobaste en tu canal",
    outcome:
      "En la app no había ninguna encuesta ni beneficio a tu nombre, y ahí mismo estaba escrito por qué esas preguntas no son inocentes: son las que usa el banco para identificarte. Dejaste la llamada esperando mientras mirabas.",
  },
};

const SENALES: Senal[] = [
  {
    id: "s1",
    targetId: "preguntas",
    pantalla: "n2",
    texto:
      "Fecha de nacimiento y apellido de tu madre <b>no son datos de una encuesta</b>: son las preguntas de seguridad con las que un banco comprueba por teléfono que eres tú.",
  },
  {
    id: "s2",
    targetId: "amable",
    pantalla: "n2",
    texto:
      "<b>No hay urgencia ni amenaza</b>, y eso es justo lo que lo hace difícil. La amabilidad y la calma también son técnica: nadie desconfía de quien no le apura.",
  },
  {
    id: "s3",
    targetId: "protocolo",
    pantalla: "n3b",
    texto:
      '<b>"Es el protocolo."</b> Preguntar no incomoda a quien está estafando: tiene la respuesta preparada, y de paso te recuerda el beneficio que pierdes si dices que no.',
  },
  {
    id: "s4",
    targetId: "ultimos-datos",
    pantalla: "n3",
    texto:
      "Los datos van llegando <b>de a poco</b>, y cada uno parece pequeño al lado del anterior. Juntos son el juego completo de respuestas de seguridad.",
  },
  {
    id: "s5",
    targetId: "sin-campana",
    pantalla: "e_verifica",
    texto:
      "En la app <b>no había ninguna encuesta ni beneficio</b>. Lo que un banco quiere de ti aparece en tu banca en línea, no en una llamada que empezaron ellos.",
  },
];

const RULE =
  "Regla de oro: los datos que <b>no parecen secretos</b> —tu fecha de nacimiento, el apellido de tu madre, tu agencia, los últimos dígitos de tu tarjeta— son los que usan para hacerse pasar por ti. No hace falta que te pidan una clave para robarte: cuelga y llama tú.";

const RESUMEN =
  'Una encuesta de satisfacción de tu banco te hace unas preguntas para "validarte".';

const CONTEXTO: Contexto = {
  antes: (
    <>
      Cliente del <strong>Banco del Litoral</strong> desde hace años. La semana
      pasada estuviste en la agencia y la fila estaba larguísima, así que una
      encuesta sobre la atención <strong>no te extraña</strong>.
    </>
  ),
  ahora: (
    <>
      <strong>A media tarde</strong> te llama un número de Guayaquil que no
      tienes guardado.
    </>
  ),
  detalle:
    "Quien llama es amable, no te mete prisa, no te pide claves ni códigos y no menciona dinero en ningún momento.",
};

function EncuestaDatos() {
  return (
    <StoryEscenario
      escenarioId="vishing/encuesta-datos"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
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
          Puedes no contestar, responder la encuesta, negarte, colgar en
          cualquier momento o dejar la llamada esperando y mirar en tu banca si
          esa encuesta existe. Fíjate menos en el tono y más en qué te están
          preguntando.
        </p>
      }
    />
  );
}

export default EncuestaDatos;
