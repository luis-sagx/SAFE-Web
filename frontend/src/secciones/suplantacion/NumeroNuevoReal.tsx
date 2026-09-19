import { Contact, Images, MessageCircle } from "lucide-react";
import ScenarioStory, {
  type PhoneApp,
  type ScreenNode,
} from "../../components/StoryEscenario";
import type { Context } from "../../components/ui/ContextoEscenario";
import type { ScreenView } from "../../components/ui/DeviceScreen";
import type { Signal } from "../../components/ui/PanelVeredicto";
import type { Story } from "../../hooks/useStoryEngine";

// Espeja a cambio-numero: mismo montaje, pero aquí el mensaje es real. Existe
// para no enseñar "desconfía de todo número nuevo": comprobar es la lección,
// no la sospecha.

const AUNT = "Rocío";
const NUMBER_NEW = "+593 98 052 6614";

const GREETING = {
  text: "Mijo, soy tu tía Rocío 🙋‍♀️ se me perdió el celular el sábado en el bus. Ya saqué otro chip, este es mi número nuevo, guárdamelo cuando puedas.",
  time: "11:05",
  senal: "saludo",
};

const AUDIO = {
  text: "Mijo, no te asustes, es tu tía Rocío. Nada grave, solo que perdí el celular en el bus el sábado y recién pude sacar otro chip. Cuando puedas me guardas este número, y salúdame a tu mamá.",
  time: "11:06",
  voz: "0:12",
  rol: "mujer",
  senal: "audio",
};

const CHAT: ScreenView = {
  kind: "sms",
  sender: NUMBER_NEW,
  sub: "No está en tus contactos · toca para ver el perfil",
  senalRemitente: "remitente",
  perfilGoto: "n1b",
  perfilLabel: "Abrió el perfil del número que le escribía",
  msgs: [GREETING, AUDIO],
  respuestas: [
    {
      texto: "Tía, ¿usted es? Déjeme llamarla.",
      goto: "e_verifica",
      label: "Dijo que iba a llamarla para comprobar",
    },
    {
      texto: "¿Cómo se llamaba el perro que tenía en Santo Domingo?",
      goto: "n2b",
      label: "Preguntó algo que solo su tía sabría",
    },
    {
      texto: "Listo tía, ya la guardo.",
      goto: "e_confia",
      label: "Guardó el número sin comprobar nada",
    },
  ],
  volverGoto: "e_ignora",
  volverLabel: "Salió del chat sin contestar",
};

const PROFILE: ScreenView = {
  kind: "web",
  app: "Mensajes",
  url: "perfil",
  secure: true,
  brand: "Información del contacto",
  title: NUMBER_NEW,
  subtitle: "No guardado en tu agenda.",
  datos: [
    {
      etiqueta: "Foto de perfil",
      valor: "La de tu tía con tu prima, de la fiesta de diciembre",
    },
    {
      etiqueta: "En esta app desde",
      valor: "Hace 2 días",
      senal: "antiguedad",
    },
    {
      etiqueta: "Grupos en común",
      valor: "Ninguno todavía",
      senal: "antiguedad",
    },
  ],
  aviso:
    "Una cuenta recién creada no prueba nada por sí sola: la tiene igual quien acaba de cambiar de chip y quien acaba de copiar un perfil. Lo que decide es lo que pase después.",
  cerrarGoto: "n1",
  cerrarLabel: "Volvió al chat desde el perfil",
  fields: [],
  button: "",
};

// Solo se usa como fondo de e_verifica: comprobar por llamada resuelve la
// duda ahí mismo, sin un paso más que confirmar.
const ANSWERS: ScreenView = {
  kind: "call",
  quien: AUNT,
  numero: NUMBER_NEW,
  etiqueta: "Número nuevo, sin guardar",
  dialogo: [
    {
      texto:
        "¡Aló, mijo! Sí, soy yo. Qué bueno que me llamas, así te queda grabado el número. No, no necesito nada, solo avisarte. Salúdame a tu mamá y nos vemos el domingo.",
      rol: "mujer",
      senal: "contesta",
    },
  ],
};

// Aunque conteste bien, queda la última decisión: agregarla o seguir
// desconfiando. Rechazar aquí ya no es prudencia, es no aceptar la prueba
// que uno mismo pidió.
const RESPONDS_WELL: ScreenView = {
  ...CHAT,
  msgs: [
    GREETING,
    AUDIO,
    {
      text: "¿Cómo se llamaba el perro que tenía en Santo Domingo?",
      time: "11:08",
      mine: true,
    },
    {
      text: "Ay mijo 😂 Canelo, y me mordía las plantas. ¿Ya me crees? Llámame cuando quieras, aquí estoy.",
      time: "11:09",
      senal: "responde",
    },
  ],
  respuestas: [
    {
      texto: "Listo tía, ya la guardo.",
      goto: "e_verifica_texto",
      label: "Agregó el número a sus contactos tras comprobar",
    },
    {
      texto: "Igual no le creo, esto no me cuadra.",
      goto: "e_rechaza_texto",
      label: "Desconfió aunque contestó bien",
    },
  ],
};

const CONTACTS: ScreenView = {
  kind: "web",
  app: "Teléfono",
  url: "contactos",
  secure: true,
  brand: "Contactos",
  title: "Tu agenda",
  opciones: [
    {
      texto: `Tía ${AUNT} · número anterior`,
      detalle: "+593 99 331 7742 · el que tenías guardado, ahora apagado",
      goto: "n5",
      label: "Llamó al número anterior de su tía",
    },
    { texto: "Mamá", detalle: "+593 99 445 1120" },
    { texto: "Casa", detalle: "02 244 1180" },
    { texto: "Trabajo", detalle: "02 380 1100" },
  ],
  fields: [],
  button: "",
};

const OFF: ScreenView = {
  kind: "web",
  app: "Teléfono",
  url: "llamada",
  secure: true,
  brand: "Llamada terminada",
  title: "El número anterior está apagado",
  subtitle:
    "Una grabación dice que el teléfono se encuentra apagado o fuera del área de servicio.",
  datos: [
    {
      etiqueta: "Qué significa",
      valor:
        "Encaja con lo que te contó: perdió ese celular y ese chip ya no está activo",
      senal: "apagado",
    },
    {
      etiqueta: "Qué falta",
      valor: "Hablar con ella en el número nuevo, o preguntarle algo suyo",
    },
  ],
  cerrarGoto: "n4",
  cerrarLabel: "Volvió a la agenda",
  fields: [],
  button: "",
};

const APPS: PhoneApp[] = [
  { Icono: MessageCircle, texto: "Mensajes", color: "#2f9e44", hilo: "sms" },
  {
    Icono: Contact,
    texto: "Teléfono",
    color: "#1971c2",
    goto: "n4",
    label: "Abrió la agenda",
  },
  { Icono: Images, texto: "Galería", color: "#c2410c", relleno: "galeria" },
];

export const STORY: Story<ScreenNode> = {
  n1: { kind: "scene", view: CHAT },
  n1b: { kind: "scene", view: PROFILE },
  n2b: { kind: "scene", view: RESPONDS_WELL },
  n4: { kind: "scene", view: CONTACTS },
  n5: { kind: "scene", view: OFF },
  e_confia: {
    kind: "partial",
    view: CHAT,
    verdict: "Era ella, pero guardaste sin comprobar nada",
    outcome:
      "No pasó nada malo porque el mensaje era real: tu tía sí cambió de número. Pero lo aceptaste sin comprobar, y esta vez tuviste suerte. Una llamada o una pregunta que solo ella sepa responder resuelve la duda en medio minuto.",
    score: 50,
  },
  e_verifica: {
    kind: "good",
    view: ANSWERS,
    verdict: "Acertaste · comprobaste sin desconfiar de más",
    outcome:
      "Era ella. Una llamada de treinta segundos resuelve la duda entera: guardaste el número y quedaron de verse el domingo. Comprobar no es ofender a nadie.",
  },
  e_verifica_texto: {
    kind: "good",
    view: RESPONDS_WELL,
    verdict: "Acertaste · comprobaste sin desconfiar de más",
    outcome:
      "Era ella. Una pregunta que solo tu tía podía responder resuelve la duda entera: guardaste el número y quedaron de verse el domingo. Comprobar no es ofender a nadie.",
  },
  e_rechaza_texto: {
    kind: "bad",
    view: RESPONDS_WELL,
    verdict: "No confiaste ni tras la prueba",
    outcome:
      "Le preguntaste algo que solo tu tía podía saber, y contestó bien. Aun así decidiste no creerle. Comprobar sirve si al final aceptas lo que la comprobación te dice; si nada la iba a convencer, la pregunta fue solo un trámite.",
  },
  e_ignora: {
    kind: "partial",
    view: CHAT,
    verdict: "Prudente, pero era tu tía",
    outcome:
      "No contestaste, y eso nunca te va a costar dinero. Pero era ella de verdad: se quedó sin poder avisarte y tú sin su número. Comprobar cuesta una llamada; ignorar cuesta la relación.",
    score: 50,
  },
};

const SIGNALS: Signal[] = [
  {
    id: "s1",
    targetId: "saludo",
    pantalla: "n1",
    texto:
      "<b>No pide nada.</b> Avisa de un cambio y ya; un mensaje falso siempre acaba pidiendo algo.",
  },
  {
    id: "s2",
    targetId: "audio",
    pantalla: "n1",
    texto:
      "La nota de voz <b>no mete prisa</b>. Sola no basta: una voz clonada tampoco sonaría rara.",
  },
  {
    id: "s3",
    targetId: "antiguedad",
    pantalla: "n1b",
    texto:
      "La cuenta es <b>nueva</b>, igual que en una suplantación. Quien cambia de chip empieza de cero.",
  },
  {
    id: "s4",
    targetId: "responde",
    pantalla: "n2b",
    texto:
      "Contesta <b>lo que solo ella sabría</b>, con detalles. Ninguna suplantación pasa esa prueba.",
  },
  {
    id: "s5",
    targetId: "contesta",
    pantalla: "e_verifica",
    texto:
      "<b>Contesta la llamada</b> al primer timbre y sin prisa. Quien suplanta nunca puede hablar.",
  },
];

const RULE =
  "Regla de oro: comprobar no es desconfiar. Una llamada o una pregunta que solo esa persona sepa responder resuelve un cambio de número en medio minuto, sin ofender a nadie.";

const SUMMARY =
  "Tu tía escribe desde un número nuevo para avisar que perdió el celular.";

const CONTEXT: Context = {
  antes: (
    <>
      Tu tía <strong>Rocío</strong> te escribe cada tanto y la ves en las
      reuniones familiares. Tienes su número de siempre guardado.
    </>
  ),
  ahora: (
    <>
      <strong>Un lunes por la mañana</strong> te escribe un número desconocido
      diciendo que es ella, con una nota de voz.
    </>
  ),
};

function RealNewNumber() {
  return (
    <ScenarioStory
      escenarioId="suplantacion/numero-nuevo-familia"
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
          Actúa sobre el teléfono como lo harías con el tuyo: contesta, escucha
          la nota de voz, mira el perfil de quien escribe y usa{" "}
          <strong>cualquier app de abajo</strong>.
        </p>
      }
      pista={
        <p>
          Puedes contestarle, comprobar quién es de varias maneras, dejarlo
          pasar o seguirle la conversación.
        </p>
      }
    />
  );
}

export default RealNewNumber;
