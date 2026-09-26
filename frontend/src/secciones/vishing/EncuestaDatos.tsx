import { Images, Landmark, Phone } from "lucide-react";
import ScenarioStory, {
  type PhoneApp,
  type ScreenNode,
} from "../../components/StoryEscenario";
import type { Context } from "../../components/ui/ContextoEscenario";
import type { ScreenView } from "../../components/ui/DeviceScreen";
import type { Signal } from "../../components/ui/PanelVeredicto";
import type { Story } from "../../hooks/useStoryEngine";
import { IDENTITY_FAKE } from "../../lib/identidadFicticia";

// El más difícil del módulo: no pide dinero ni mete prisa, así que todo lo
// que enseñan los otros escenarios sale bien aquí. La lección es que los
// datos que no parecen secretos son los que abren la puerta.

const NUMBER = "+593 4 500 1180";
const BIRTH = "14 de marzo del 78";
const MOTHER = "Rosa Elena Cedeño";

const INCOMING: ScreenView = {
  kind: "call",
  entrante: true,
  quien: NUMBER,
  numero: "Guayaquil, Ecuador",
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
      "Buenas tardes, le habla Katherine del área de calidad del Banco del Litoral. Estamos haciendo una encuesta de dos minutos sobre la atención en su agencia, ¿me regala un momentito?",
    senal: "amable",
  },
  {
    texto:
      "Gracias. Por participar le exoneramos la comisión de manejo de este mes. Antes de empezar valido que hablo con el titular: ¿me confirma su fecha de nacimiento y el nombre completo de su mamá?",
    senal: "preguntas",
  },
];

const CALL: ScreenView = {
  kind: "call",
  quien: NUMBER,
  numero: "Guayaquil, Ecuador",
  etiqueta: "No está en tus contactos",
  senalQuien: "quien",
  dialogo: OPENING,
  decir: [
    {
      texto: `${BIRTH}, y mi mamá es ${MOTHER}.`,
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

const CONTINUES = [
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

function createSurveyView(
  previous: { texto: string; mio?: boolean; senal?: string }[],
): ScreenView {
  return {
    kind: "call",
    quien: NUMBER,
    numero: "Guayaquil, Ecuador",
    etiqueta: "No está en tus contactos",
    senalQuien: "quien",
    dialogo: [...OPENING, ...previous, ...CONTINUES],
    decir: [
      {
        texto: `Termina en ${IDENTITY_FAKE.tarjeta}, y la abrí en la agencia Alborada.`,
        goto: "e_datos",
        label: "Dio los últimos dígitos de la tarjeta y su agencia",
      },
    ],
    colgarGoto: "e_cuelga_datos",
    colgarLabel: "Colgó después de haber dado sus datos personales",
  };
}

const GAVE_DATA = createSurveyView([
  { texto: `${BIRTH}, y mi mamá es ${MOTHER}.`, mio: true },
]);

const GAVE_IN = createSurveyView([
  { texto: "¿Y para una encuesta necesitan todo eso?", mio: true },
  {
    texto:
      "Es solo para validar que hablo con el titular de la cuenta, es el protocolo. Si prefiere lo dejamos, aunque el beneficio de la comisión se registra hoy y mañana ya no le puedo ayudar.",
    senal: "protocolo",
  },
  { texto: `Bueno, está bien: ${BIRTH}, mi mamá es ${MOTHER}.`, mio: true },
]);

const DOUBTED: ScreenView = {
  ...CALL,
  dialogo: [
    ...OPENING,
    { texto: "¿Y para una encuesta necesitan todo eso?", mio: true },
    {
      texto:
        "Es solo para validar que hablo con el titular de la cuenta, es el protocolo. Si prefiere lo dejamos, aunque el beneficio de la comisión se registra hoy y mañana ya no le puedo ayudar.",
      senal: "protocolo",
    },
  ],
  decir: [
    {
      texto: `Bueno, está bien: ${BIRTH}, mi mamá es ${MOTHER}.`,
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

const BANK: ScreenView = {
  kind: "web",
  app: "Banco del Litoral",
  url: "bancolitoral.ec",
  secure: true,
  brand: "Banca móvil",
  title: "Hola de nuevo",
  subtitle: `Tarjeta *${IDENTITY_FAKE.tarjeta} · cupo disponible $1.240,00`,
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

const MAILBOX: ScreenView = {
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
    "El Banco del Litoral no hace encuestas telefónicas ni te pide datos personales por teléfono. Tus datos de seguridad (fecha de nacimiento, apellidos familiares, agencia y dígitos de tu tarjeta) son los que usamos para identificarte: no los compartas con nadie que te llame.",
  fields: [],
  button: "",
};

const APPS: PhoneApp[] = [
  { Icono: Phone, texto: "Teléfono", color: "#2f9e44", hilo: "call" },
  {
    Icono: Landmark,
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
  n3: { kind: "scene", view: GAVE_DATA },
  n3b: { kind: "scene", view: DOUBTED },
  n3c: { kind: "scene", view: GAVE_IN },
  n5: { kind: "scene", view: BANK },
  e_rechaza: {
    kind: "good",
    view: INCOMING,
    verdict: "No caíste · no contestaste",
    outcome:
      "No contestaste a un número desconocido. Una encuesta no es urgente, y tu banco no hace preguntas de seguridad por teléfono.",
  },
  e_cuelga: {
    kind: "good",
    view: DOUBTED,
    verdict: "No caíste · colgaste sin dar nada",
    outcome:
      "Colgaste sin soltar un dato. Fuera real o falsa la llamada, no perdiste nada: siempre puedes llamar tú o ir a la agencia.",
  },
  e_niega: {
    kind: "good",
    view: DOUBTED,
    verdict: "No caíste · te negaste con calma",
    outcome:
      "Dijiste que no y ofreciste ir tú a la agencia: la respuesta perfecta, sin ser brusco. Quien estafa cuelga solo ante eso.",
  },
  e_cuelga_datos: {
    kind: "partial",
    view: GAVE_DATA,
    verdict: "Colgaste, pero ya habías dado lo importante",
    outcome: `Cortaste antes de dar los datos de la tarjeta. Pero dejaste tu fecha de nacimiento y el nombre de tu mamá, dos preguntas de seguridad que ahora sabe alguien más.`,
    score: 50,
  },
  e_datos: {
    kind: "bad",
    view: GAVE_DATA,
    verdict: "Caíste en la trampa",
    outcome: `No hubo encuesta ni exoneración. Con tu fecha de nacimiento, el apellido de tu mamá, tu agencia y los dígitos de tu tarjeta, llamaron al banco haciéndose pasar por ti y entraron a tu cuenta.`,
  },
  e_verifica: {
    kind: "good",
    view: MAILBOX,
    verdict: "No caíste · lo comprobaste en tu canal",
    outcome:
      "En la app no había ninguna encuesta ni beneficio a tu nombre. Esas preguntas son justo las que el banco usa para identificarte.",
  },
};

const SIGNALS: Signal[] = [
  {
    id: "s1",
    targetId: "preguntas",
    pantalla: "n2",
    texto:
      "<b>Fecha de nacimiento y apellido de tu madre no son datos de encuesta.</b> Son las preguntas de seguridad con que el banco te identifica.",
  },
  {
    id: "s2",
    targetId: "amable",
    pantalla: "n2",
    texto:
      "<b>No hay urgencia ni amenaza</b>, y eso lo hace difícil. La amabilidad también es técnica: nadie desconfía de quien no apura.",
  },
  {
    id: "s3",
    targetId: "protocolo",
    pantalla: "n3b",
    texto:
      '<b>"Es el protocolo."</b> La respuesta ya está preparada, y de paso te recuerda el beneficio que pierdes si dices que no.',
  },
  {
    id: "s4",
    targetId: "ultimos-datos",
    pantalla: "n3",
    texto:
      "<b>Los datos llegan de a poco</b>, cada uno pequeño. Juntos son el juego completo de respuestas de seguridad.",
  },
  {
    id: "s5",
    targetId: "sin-campana",
    pantalla: "e_verifica",
    texto:
      "<b>En la app no había ninguna encuesta ni beneficio.</b> Lo que el banco quiere de ti aparece en tu banca en línea, no en su llamada.",
  },
];

const RULE =
  "Regla de oro: <b>los datos que no parecen secretos también identifican</b> (fecha de nacimiento, apellido de tu madre, agencia, dígitos de tarjeta). No hace falta una clave para robarte: cuelga y llama tú.";

const SUMMARY =
  'Una encuesta de satisfacción de tu banco te hace unas preguntas para "validarte".';

export const CONTEXT: Context = {
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
};

function DataSurvey() {
  return (
    <ScenarioStory
      escenarioId="vishing/encuesta-datos"
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
          Es una llamada en vivo: hay alguien hablando al otro lado y espera
          tu respuesta cuando termine. Actúa sobre el teléfono como lo
          harías con el tuyo: contesta o rechaza, cuelga cuando quieras y
          usa <strong>cualquier app de abajo</strong>, incluso con la
          llamada abierta.
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

export default DataSurvey;
