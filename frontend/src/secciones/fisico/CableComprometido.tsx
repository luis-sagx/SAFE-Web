import ScenarioStory, { type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'

const REST: ScreenView = { kind: 'escena', src: '/escenarios/fisico/cargador-sospechoso.webp', alt: 'Cable desconocido en la sala de descanso', zonas: [{ id: 'cable-descanso', x: '63%', y: '66%', ancho: '18%', alto: '22%' }] }
const REST_WITH_FLASH: ScreenView = { ...REST, destello: { x: '69%', y: '81%', goto: 'n1', label: 'Inspeccionó el cable' } }
const DESKTOP: ScreenView = { kind: 'escena', src: '/escenarios/fisico/imagen-escritorio.webp', alt: 'Cable desconocido sobre un escritorio', zonas: [{ id: 'cable-escritorio', x: '42%', y: '53%', ancho: '22%', alto: '20%' }] }
const DESKTOP_WITH_FLASH: ScreenView = { ...DESKTOP, destello: { x: '53%', y: '63%', goto: 'n2', label: 'Inspeccionó el cable' } }
const SIGNALS_REST: Signal[] = [{ id: 'cable-descanso', targetId: 'cable-descanso', pantalla: 'n1', texto: 'Un <b>cable sin dueño</b> también puede ser un dispositivo de ataque.' }]
const SIGNALS_COMPLETE: Signal[] = [...SIGNALS_REST, { id: 'cable-escritorio', targetId: 'cable-escritorio', pantalla: 'n2', texto: 'Llevarlo al escritorio no lo hace seguro: <b>no se conecta</b>; se entrega a IT o se desecha.' }]
const STORY: Story<ScreenNode> = {
  n1_ver: { kind: 'scene', view: REST_WITH_FLASH },
  n1: { kind: 'scene', view: REST, choices: [
    { label: 'Usarlo para cargar tu celular aquí', goto: 'e_carga_alli' },
    { label: 'Dejarlo donde está y avisar a IT', goto: 'e_avisa' },
    { label: 'Llevártelo a tu escritorio, ahí lo necesitas más', goto: 'n2_ver' },
  ] },
  n2_ver: { kind: 'scene', view: DESKTOP_WITH_FLASH },
  n2: { kind: 'scene', view: DESKTOP, choices: [
    { label: 'Conectarlo a tu celular para cargar', goto: 'e_celular' },
    { label: 'Conectarlo a tu computadora para revisar qué es', goto: 'e_pc' },
    { label: 'Entregarlo a IT para análisis', goto: 'e_it' },
    { label: 'Descartarlo directamente', goto: 'e_basura' },
  ] },
  e_carga_alli: { kind: 'bad', view: REST, senales: SIGNALS_REST, verdict: 'Riesgo detectado', outcome: 'Conectaste un cable desconocido. Un cable puede llevar electrónica para robar datos o ejecutar acciones cuando se conecta.' },
  e_avisa: { kind: 'good', view: REST, senales: SIGNALS_REST, verdict: 'Decisión segura', outcome: 'No lo conectaste y avisaste a IT para que lo retire y analice de forma segura.' },
  e_celular: { kind: 'bad', view: DESKTOP, senales: SIGNALS_COMPLETE, verdict: 'Riesgo detectado', outcome: 'Conectar el cable a tu celular expone el dispositivo a una interfaz desconocida.' },
  e_pc: { kind: 'bad', view: DESKTOP, senales: SIGNALS_COMPLETE, verdict: 'Riesgo detectado', outcome: 'Conectar un cable desconocido a la computadora puede comprometer tu equipo y la red.' },
  e_it: { kind: 'good', view: DESKTOP, senales: SIGNALS_COMPLETE, verdict: 'Decisión segura', outcome: 'Entregaste el cable a IT sin conectarlo; el análisis se hará en un entorno controlado.' },
  e_basura: { kind: 'good', view: DESKTOP, senales: SIGNALS_COMPLETE, verdict: 'Decisión segura', outcome: 'Lo descartaste sin conectarlo. No se expuso ningún equipo al cable desconocido.' },
}
const context: Context = { antes: 'Los cables y cargadores desconocidos pueden ocultar electrónica maliciosa, igual que un USB.', ahora: <><strong>En la sala de descanso</strong> encuentras un cable conectado que no parece pertenecer a nadie. Si lo llevas a tu escritorio, la segunda escena mostrará el mismo cable en tu puesto: es una continuación, no un final.</> }
export default function CompromisedCable() { return <ScenarioStory escenarioId="fisico/cable-comprometido" resumen="Cable desconocido — decide cómo actuar" contexto={context} nota="Un cable no es confiable solo porque parece servir para cargar." story={STORY} initialNode="n1_ver" senales={SIGNALS_REST} rule="<b>No conectes cables desconocidos.</b> Repórtalos o entrégalos para análisis sin exponer un dispositivo." restartLabel="Intentar de nuevo" cuandoTermina="El escenario termina al conectar, reportar o descartar el cable; llevártelo abre una segunda decisión." pista="No hace falta conectar el cable a nada para decidir: evita cualquier opción que lo enchufe —a tu celular o a tu computadora— y prefiere reportarlo o descartarlo." /> }
