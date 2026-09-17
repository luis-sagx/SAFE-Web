import ScenarioStory, { type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import publicChargerImg from '../../assets/escenarios/fisico/cargador-publico.webp'

// El "juice jacking": el mismo cable que carga también puede llevar datos. Un
// puerto USB público que nadie de confianza controla es indistinguible por
// fuera de uno seguro, la señal no está en cómo se ve el puerto, sino en si
// hay o no un tomacorriente normal para el propio cargador.
const KIOSK: ScreenView = {
  kind: 'escena',
  src: publicChargerImg,
  alt: 'Estación de carga pública con varios puertos USB en un centro comercial',
  zonas: [{ id: 'panel-usb', x: '57%', y: '30%', ancho: '16%', alto: '17%' }],
}
const KIOSK_WITH_FLASH: ScreenView = {
  ...KIOSK,
  destello: { x: '65%', y: '45%', goto: 'n1', label: 'Inspeccionó la estación de carga' },
}

const SIGNALS: Signal[] = [
  {
    id: 'panel-usb',
    targetId: 'panel-usb',
    pantalla: 'n1',
    texto:
      'El letrero dice <b>"SOLO USB"</b>: no hay ningún tomacorriente normal, solo puertos que llevan corriente y datos por el mismo cable.',
  },
]

const STORY: Story<ScreenNode> = {
  n1_ver: { kind: 'scene', view: KIOSK_WITH_FLASH },
  n1: {
    kind: 'scene',
    view: KIOSK,
    choices: [
      { label: 'Conectar tu cable directo a uno de los puertos USB del mueble', goto: 'e_carga_directa' },
      { label: 'Buscar un tomacorriente normal cerca y usar tu propio cargador', goto: 'e_tomacorriente' },
      {
        label: 'Conectar primero tu batería portátil al puerto USB, y el celular a la batería',
        goto: 'e_power_bank',
      },
      { label: 'Aguantar sin cargar hasta llegar a casa', goto: 'e_espera' },
    ],
  },
  e_carga_directa: {
    kind: 'bad',
    view: KIOSK,
    senales: SIGNALS,
    verdict: 'Riesgo detectado',
    outcome:
      'El cable de carga lleva también las líneas de datos. Un puerto público que nadie de confianza controla puede copiar lo que hay en tu celular o instalarle algo mientras carga, sin que veas nada raro en la pantalla.',
  },
  e_tomacorriente: {
    kind: 'good',
    view: KIOSK,
    senales: SIGNALS,
    verdict: 'Decisión segura',
    outcome:
      'Un tomacorriente solo entrega corriente eléctrica: no tiene forma de leer ni escribir nada en tu celular. Es la forma más segura de cargar fuera de casa, aunque tome un poco más buscarlo.',
  },
  e_power_bank: {
    kind: 'good',
    view: KIOSK,
    senales: SIGNALS,
    verdict: 'Decisión segura',
    outcome:
      'La batería portátil corta la conexión de datos entre el puerto público y tu celular: por ese tramo solo pasa corriente, igual que si fuera un tomacorriente.',
  },
  e_espera: {
    kind: 'partial',
    view: KIOSK,
    senales: SIGNALS,
    verdict: 'Respuesta incompleta',
    outcome:
      'Evitaste el riesgo, pero te quedaste sin batería el resto del día sin necesidad: bastaba buscar un tomacorriente para tu propio cargador, o cargar primero una batería portátil.',
  },
}

const context: Context = {
  antes: 'Sales de casa con poca batería, confiando en que durante el día vas a encontrar dónde cargar.',
  ahora: (
    <>
      <strong>A media tarde</strong> el celular te queda en 3%, y justo ahí, en el pasillo del centro
      comercial, ves un mueble de carga pública con varios puertos USB, pero ningún tomacorriente normal
      para tu propio cargador.
    </>
  ),
}

export default function CompromisedCable() {
  return (
    <ScenarioStory
      escenarioId="fisico/cable-comprometido"
      resumen="Estación de carga pública, decide cómo cargar tu celular"
      contexto={context}
      nota="Un puerto de carga no se distingue por fuera; lo que importa es si hay o no un tomacorriente normal."
      story={STORY}
      initialNode="n1_ver"
      senales={SIGNALS}
      rule="<b>Nunca conectes tu celular directo a un puerto de carga público desconocido.</b> El cable lleva datos, no solo corriente: usa tu propio cargador en un tomacorriente, o carga primero una batería portátil."
      restartLabel="Intentar de nuevo"
      cuandoTermina="El escenario termina al elegir cómo cargas el celular."
      pista="Piensa en qué parte del cable puede llevar más que corriente eléctrica, y busca la opción que evita que tu celular quede conectado directo a ese puerto."
    />
  )
}
