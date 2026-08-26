import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'

const USB_ESTACIONAMIENTO: ScreenView = {
  kind: 'web',
  app: 'Situación',
  url: 'parking',
  secure: true,
  brand: 'Estacionamiento',
  title: 'USB negro en el piso',
  subtitle: 'Etiqueta manuscrita: "NÓMINA DICIEMBRE, CONFIDENCIAL"',
  datos: [
    {
      etiqueta: 'Ubicación',
      valor: 'Cerca de tu auto en el estacionamiento',
      senal: 'peligro',
    },
    {
      etiqueta: 'Dispositivo',
      valor: 'USB negro con etiqueta manuscrita',
      senal: 'peligro',
    },
    {
      etiqueta: 'Contexto',
      valor: 'Llegas temprano, no hay nadie cerca',
      senal: 'peligro',
    },
  ],
  aviso:
    'Llegas temprano. Cerca de tu auto, en el suelo, hay un USB negro. La etiqueta promete algo valioso: "NÓMINA DICIEMBRE, CONFIDENCIAL". No hay nadie para preguntar de quién es.',
  opciones: [
    {
      texto: 'Conectarlo a tu laptop para ver de quién es',
      goto: 'e_conecta',
      label: 'Conectó un USB desconocido a su computador',
    },
    {
      texto: 'Llevarlo directo a Seguridad o IT',
      goto: 'e_seguro',
      label: 'Reportó el dispositivo a Seguridad',
    },
    {
      texto: 'Dejarlo ahí, no es asunto mío',
      goto: 'e_deja',
      label: 'No reportó un dispositivo sospechoso',
    },
    {
      texto: 'Conectarlo solo para escanear con antivirus',
      goto: 'e_antivirus',
      label: 'Intentó "protegerse" escaneando con antivirus',
    },
  ],
  fields: [],
  button: '',
}

const CABLE_CAFE: ScreenView = {
  kind: 'web',
  app: 'Situación',
  url: 'breakroom',
  secure: true,
  brand: 'Sala de descanso',
  title: 'Cable USB en el enchufe',
  subtitle: 'Se ve nuevo, está conectado y sin dueño aparente',
  datos: [
    {
      etiqueta: 'Ubicación',
      valor: 'En el tomacorriente público de la sala de descanso',
      senal: 'peligro',
    },
    {
      etiqueta: 'Cable',
      valor: 'USB de carga, se ve nuevo y en buen estado',
      senal: 'peligro',
    },
    {
      etiqueta: 'Contexto',
      valor: 'Nadie lo reclama, ideal para cargar tu celular',
      senal: 'peligro',
    },
  ],
  aviso:
    'Vas a cargar tu celular y notas un cable USB ya conectado al enchufe público. Se ve nuevo y en buen estado. Parece perfecto para tu teléfono.',
  opciones: [
    {
      texto: 'Usarlo para cargar tu celular',
      goto: 'e_usa_cable',
      label: 'Usó un cable de carga desconocido en su teléfono',
    },
    {
      texto: 'Llevártelo a tu escritorio',
      goto: 'e_lleva',
      label: 'Llevó el cable a su puesto de trabajo',
    },
    {
      texto: 'Avisarle a mantenimiento sobre el cable',
      goto: 'e_seguro_cable',
      label: 'Reportó el cable desconocido a mantenimiento',
    },
    {
      texto: 'Usarlo solo para cargar, sin pasar archivos',
      goto: 'e_solo_carga',
      label: 'Creyó que "solo cargar" lo protegería de los riesgos',
    },
  ],
  fields: [],
  button: '',
}

const VISITANTE: ScreenView = {
  kind: 'web',
  app: 'Situación',
  url: 'reception',
  secure: true,
  brand: 'Recepción',
  title: 'USB de un visitante',
  subtitle: 'Apurado, amable, "su laptop no tiene lector"',
  datos: [
    {
      etiqueta: 'Persona',
      valor: 'Visitante desconocido en recepción',
      senal: 'peligro',
    },
    {
      etiqueta: 'Dispositivo',
      valor: 'Memoria USB con "presentación"',
      senal: 'peligro',
    },
    {
      etiqueta: 'Tono',
      valor: 'Urgente, amable, manipulador',
      senal: 'peligro',
    },
  ],
  aviso:
    'Un visitante en recepción te pide conectar su USB a tu computador de trabajo para "pasar rápido" una presentación. Parece apurado y agradable. Dice que su laptop "no tiene lector".',
  opciones: [
    {
      texto: 'Conectarlo para ayudarlo rápido',
      goto: 'e_conecta_visitante',
      label: 'Conectó un USB de un visitante desconocido',
    },
    {
      texto: 'Decirle que no puedes ayudarlo',
      goto: 'e_rechaza',
      label: 'Se negó, pero generó fricción con el visitante',
    },
    {
      texto: 'Ofrecerle equipo para visitas o canal oficial',
      goto: 'e_seguro_visitante',
      label: 'Siguió el protocolo de seguridad con visitantes',
    },
    {
      texto: 'Conectarlo solo un segundo',
      goto: 'e_segundo',
      label: 'Creyó que "solo un segundo" reducía el riesgo',
    },
  ],
  fields: [],
  button: '',
}

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: USB_ESTACIONAMIENTO },
  n2: { kind: 'scene', view: CABLE_CAFE },
  n3: { kind: 'scene', view: VISITANTE },
  e_conecta: {
    kind: 'bad',
    view: USB_ESTACIONAMIENTO,
    verdict: 'Conectaste un USB desconocido',
    outcome:
      'Un USB tirado en el piso puede ejecutar código automáticamente o hacerse pasar por teclado (ataque HID) inyectando comandos. La etiqueta "NÓMINA" es el cebo. Tu computador de trabajo tiene acceso a sistemas críticos. Comprometido.',
  },
  e_usa_cable: {
    kind: 'bad',
    view: CABLE_CAFE,
    verdict: 'Usaste un cable de carga desconocido',
    outcome:
      'Un cable en un tomacorriente público puede llevar un chip que roba datos o inyecta malware apenas se conecta (juice jacking). Tu teléfono es acceso a cuentas, mensajes, autenticación de dos factores. Comprometido.',
  },
  e_conecta_visitante: {
    kind: 'bad',
    view: VISITANTE,
    verdict: 'Conectaste USB de visitante desconocido',
    outcome:
      'Tu computador de trabajo es el acceso más valioso. Un visitante pidiéndote que conectes su dispositivo es la técnica de ingeniería social más directa. La simpatía y la prisa son parte del ataque. Sistema comprometido.',
  },
  e_deja: {
    kind: 'partial',
    view: USB_ESTACIONAMIENTO,
    verdict: 'No conectaste, pero dejaste la trampa activa',
    outcome:
      'Fue la acción correcta no conectarlo a tu computador. Pero dejarlo ahí significa que el siguiente compañero puede picarse. El dispositivo sigue siendo una amenaza activa para otros.',
  },
  e_lleva: {
    kind: 'bad',
    view: CABLE_CAFE,
    verdict: 'Llevaste el cable a tu puesto',
    outcome:
      'El riesgo no desaparece por cambiar de ubicación. Llevarlo a tu escritorio, donde está tu computador de trabajo con más acceso, aumenta la amenaza. El cable sigue siendo comprometido.',
  },
  e_solo_carga: {
    kind: 'bad',
    view: CABLE_CAFE,
    verdict: 'Creíste que "solo cargar" te protegería',
    outcome:
      'Los ataques por cable no usan archivos: el dispositivo se hace pasar por teclado y ejecuta comandos apenas se conecta, antes de que un antivirus reaccione. Tu teléfono está comprometido.',
  },
  e_rechaza: {
    kind: 'partial',
    view: VISITANTE,
    verdict: 'Te negaste, pero generaste fricción',
    outcome:
      'Protegiste tu sistema, pero de forma poco profesional. El visitante ahora sabe que la seguridad es débil en este punto. Hay formas más amables y efectivas de decir que no.',
  },
  e_segundo: {
    kind: 'bad',
    view: VISITANTE,
    verdict: 'Un segundo es tiempo de sobra',
    outcome:
      'Los ataques HID ejecutan comandos en milisegundos, antes de que reacciones. "Solo un momento" es tiempo de sobra para comprometer el equipo. Tu computador de trabajo está ahora expuesto.',
  },
  e_seguro: {
    kind: 'good',
    view: USB_ESTACIONAMIENTO,
    verdict: 'Reportaste el dispositivo a Seguridad',
    outcome:
      'Correcto. Ante cualquier dispositivo desconocido, el protocolo es entregarlo a Seguridad o IT para análisis en un entorno controlado. Es la única opción segura. Tu computador protegido.',
  },
  e_seguro_cable: {
    kind: 'good',
    view: CABLE_CAFE,
    verdict: 'Reportaste el cable a mantenimiento',
    outcome:
      'Correcto. Cualquier accesorio de carga desconocido en espacios comunes debe reportarse, nunca usarse. Proteges tu dispositivo y alertas al equipo sobre el riesgo. Acción segura.',
  },
  e_seguro_visitante: {
    kind: 'good',
    view: VISITANTE,
    verdict: 'Seguiste el protocolo de seguridad',
    outcome:
      'Correcto. Las empresas con buenas prácticas tienen equipos aislados para invitados o canales oficiales (correo corporativo, nube aprobada). Es la forma de decir que no sin fricciones. Sistema protegido.',
  },
  e_antivirus: {
    kind: 'bad',
    view: USB_ESTACIONAMIENTO,
    verdict: 'El antivirus no te protege de ataques HID',
    outcome:
      'Muchos ataques por USB no usan archivos maliciosos que un antivirus detecte: el dispositivo ejecuta comandos como teclado en los primeros milisegundos. Tu computador ya estaba comprometido antes de que iniciara el escaneo.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'peligro',
    pantalla: 'n1',
    texto:
      'Un USB desconocido puede ejecutar código automáticamente o <b>hacerse pasar por teclado (ataque HID)</b> para inyectar comandos.',
  },
  {
    id: 's2',
    targetId: 'peligro',
    pantalla: 'n2',
    texto:
      'Un cable "olvidado" en un punto de carga puede llevar un chip que <b>roba datos o inyecta malware</b> (juice jacking).',
  },
  {
    id: 's3',
    targetId: 'peligro',
    pantalla: 'n3',
    texto:
      'Un visitante pidiéndote conectar su dispositivo es <b>ingeniería social directa</b>. La simpatía es parte de la técnica.',
  },
]

const RESUMEN = 'Identificar y rechazar dispositivos USB sospechosos. No es paranoia: es seguridad.'

const CONTEXTO: Contexto = {
  antes: 'Trabajas en una empresa con equipos conectados a sistemas críticos.',
  ahora: (
    <>
      <strong>A lo largo del día</strong> te encuentras con <strong>tres dispositivos USB sospechosos</strong> en diferentes
      ubicaciones: uno en el piso, uno en un tomacorriente público, uno que alguien te pide que conectes. Cada uno es una
      trampa potencial.
    </>
  ),
}

function Baiting() {
  return (
    <StoryEscenario
      escenarioId="fisico/baiting"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule='Regla de oro: <b>nunca conectes un dispositivo USB de origen desconocido</b> a tu computador, sin importar qué prometa o cuán urgente parezca. El protocolo es siempre: reportar a Seguridad o IT para análisis en un entorno aislado.'
      restartLabel="↻ Repetir el escenario"
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Tres situaciones, tres oportunidades para hacer lo correcto. <strong>¿Qué haces con cada dispositivo?</strong>
        </p>
      }
      pista={
        <p>
          Conectar = riesgo. Reportar a Seguridad = lo correcto. No importa si te promete datos valiosos, si parece nuevo,
          o si alguien amable te lo pide: siempre reporta.
        </p>
      }
    />
  )
}

export default Baiting
