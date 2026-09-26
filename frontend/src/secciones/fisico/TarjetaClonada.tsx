import ScenarioStory, { type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import cardSwapImg from '../../assets/escenarios/fisico/cambiazo.webp'

// El "cambiazo" en cajeros, con los detalles de casos juzgados en Ecuador:
// el pretexto del cajero que falla y la tarjeta cambiada en un descuido
// (Quito, 2025: retiros de $500 y $450), la tarjeta "limpiada" en la ropa y
// cómplices mirando la clave (Cuenca, 2021), la ayuda ofrecida a quien usa
// el cajero (Guayaquil, sentencia de 2025). El título y el contexto no
// nombran la modalidad: descubrirla es lo que se mide.
const ATM: ScreenView = {
  kind: 'escena',
  src: cardSwapImg,
  alt: 'Junto a un cajero en una calle del centro histórico, un hombre amable frota tu tarjeta en la manga de su chaqueta mientras tú extiendes la mano para recibirla; la pantalla del cajero muestra un error',
  zonas: [
    { id: 'pantalla-error', x: '82%', y: '31%', ancho: '17%', alto: '26%' },
    { id: 'tarjeta-ajena', x: '45%', y: '46%', ancho: '19%', alto: '17%' },
    { id: 'mano-oculta', x: '56%', y: '63%', ancho: '8%', alto: '16%' },
    { id: 'complice', x: '20%', y: '21%', ancho: '11%', alto: '70%' },
  ],
}

const SIGNALS: Signal[] = [
  {
    id: 'pretexto',
    targetId: 'pantalla-error',
    texto:
      '<b>El cajero "falla" justo cuando alguien cerca ofrece ayudar</b>. Es el pretexto de los casos juzgados en Quito y Cuenca.',
  },
  {
    id: 'tarjeta',
    targetId: 'tarjeta-ajena',
    texto:
      '<b>Tu tarjeta está en manos de un desconocido</b>. "Limpiarla en la ropa" es la excusa para cambiarla sin que lo notes.',
  },
  {
    id: 'mano',
    targetId: 'mano-oculta',
    texto:
      '<b>Su otra mano está dentro de la chaqueta</b>: ahí guarda la tarjeta que te va a devolver.',
  },
  {
    id: 'complice',
    targetId: 'complice',
    texto:
      '<b>Suelen trabajar en grupo</b>: mientras uno ayuda, otro mira la clave. Hay un hombre junto al cajero, sin hacer fila.',
  },
]

const STORY: Story<ScreenNode> = {
  n1: {
    kind: 'scene',
    view: ATM,
    choices: [
      { label: 'Recibirla y volver a intentar, esta vez tapando el teclado', goto: 'e_reintenta' },
      { label: 'Recibirla, agradecerle y buscar otro cajero', goto: 'e_otro_cajero' },
      {
        label: 'Recibirla y revisar ahí mismo que tenga tu nombre y tus últimos dígitos',
        goto: 'e_revisa',
      },
    ],
  },
  e_reintenta: {
    kind: 'bad',
    view: ATM,
    verdict: 'Te cambiaron la tarjeta',
    outcome:
      'La tarjeta que te devolvió no era la tuya, tapar el teclado no sirvió: su compañero vio tu clave en el primer intento. En media hora sacaron $ 500 y $ 450 con tu tarjeta real.',
  },
  e_otro_cajero: {
    kind: 'bad',
    view: ATM,
    verdict: 'Te cambiaron la tarjeta',
    outcome:
      'Guardaste sin mirar una tarjeta que no era la tuya. El lunes la app mostró retiros de $ 500 y $ 450 hechos ese viernes, con tu clave y tu tarjeta ya entregadas.',
  },
  e_revisa: {
    kind: 'good',
    view: ATM,
    verdict: 'Cambiazo detectado',
    outcome:
      'La tarjeta que te devolvió tenía otro nombre, y la bloqueaste ahí mismo desde la app del banco. Cuando intentaron sacar dinero con ella, el cajero la rechazó.',
  },
}

export const CONTEXT: Context = {
  antes:
    'Sacar efectivo es parte de la rutina, y los cajeros de la calle suelen tener gente alrededor, sobre todo al final de la semana.',
  ahora: (
    <>
      <strong>Viernes por la tarde, en el centro.</strong> Insertas tu tarjeta, digitas tu clave para
      sacar $ 60 y el cajero muestra un error. Un señor muy amable se acerca: «Estos cajeros fallan
      mucho, es la banda. Deme, se la limpio y vuelve a intentar». Le diste la tarjeta y ahora te la
      está devolviendo.
    </>
  ),
}

export default function ClonedCard() {
  return (
    <ScenarioStory
      escenarioId="fisico/tarjeta-clonada"
      resumen="Retiro en el cajero, el cajero falla"
      contexto={CONTEXT}
      nota="Mira la escena con calma antes de decidir."
      story={STORY}
      senales={SIGNALS}
      rule="<b>Tu tarjeta no sale de tus manos.</b> Si alguien la tocó, revisa tu nombre y tus últimos dígitos antes de irte, y bloquéala si no es la tuya."
      cuandoTermina="Cuando elijas qué hacer con la tarjeta que te devuelve."
      pista="La tarjeta pasó por las manos de un desconocido. Antes de volver a usarla o de irte, comprueba que de verdad sea la tuya."
    />
  )
}
