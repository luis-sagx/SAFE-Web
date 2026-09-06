import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'

const DESCANSO: ScreenView = { kind: 'escena', src: '/CargadorSospechoso.jpeg', alt: 'Cable desconocido en la sala de descanso', zonas: [{ id: 'cable-descanso', x: '38%', y: '51%', ancho: '25%', alto: '22%' }] }
const ESCRITORIO: ScreenView = { kind: 'escena', src: '/ImagenEscritorio.jpeg', alt: 'Cable desconocido sobre un escritorio', zonas: [{ id: 'cable-escritorio', x: '42%', y: '53%', ancho: '22%', alto: '20%' }] }
const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: DESCANSO, choices: [
    { label: 'Usarlo para cargar tu celular aquí', goto: 'e_carga_alli' },
    { label: 'Dejarlo donde está y avisar a IT', goto: 'e_avisa' },
    { label: 'Llevártelo a tu escritorio, ahí lo necesitas más', goto: 'n2' },
  ] },
  n2: { kind: 'scene', view: ESCRITORIO, choices: [
    { label: 'Conectarlo a tu celular para cargar', goto: 'e_celular' },
    { label: 'Conectarlo a tu computadora para revisar qué es', goto: 'e_pc' },
    { label: 'Entregarlo a IT para análisis', goto: 'e_it' },
    { label: 'Descartarlo directamente', goto: 'e_basura' },
  ] },
  e_carga_alli: { kind: 'bad', view: DESCANSO, verdict: 'Riesgo detectado', outcome: 'Conectaste un cable desconocido. Un cable puede llevar electrónica para robar datos o ejecutar acciones cuando se conecta.' },
  e_avisa: { kind: 'good', view: DESCANSO, verdict: 'Decisión segura', outcome: 'No lo conectaste y avisaste a IT para que lo retire y analice de forma segura.' },
  e_celular: { kind: 'bad', view: ESCRITORIO, verdict: 'Riesgo detectado', outcome: 'Conectar el cable a tu celular expone el dispositivo a una interfaz desconocida.' },
  e_pc: { kind: 'bad', view: ESCRITORIO, verdict: 'Riesgo detectado', outcome: 'Conectar un cable desconocido a la computadora puede comprometer tu equipo y la red.' },
  e_it: { kind: 'good', view: ESCRITORIO, verdict: 'Decisión segura', outcome: 'Entregaste el cable a IT sin conectarlo; el análisis se hará en un entorno controlado.' },
  e_basura: { kind: 'good', view: ESCRITORIO, verdict: 'Decisión segura', outcome: 'Lo descartaste sin conectarlo. No se expuso ningún equipo al cable desconocido.' },
}
const SENALES: Senal[] = [{ id: 'cable-descanso', targetId: 'cable-descanso', pantalla: 'n1', texto: 'Un <b>cable sin dueño</b> también puede ser un dispositivo de ataque.' }, { id: 'cable-escritorio', targetId: 'cable-escritorio', pantalla: 'n2', texto: 'Llevarlo al escritorio no lo hace seguro: <b>no se conecta</b>; se entrega a IT o se desecha.' }]
const contexto: Contexto = { antes: 'Los cables y cargadores desconocidos pueden ocultar electrónica maliciosa, igual que un USB.', ahora: <><strong>En la sala de descanso</strong> encuentras un cable conectado que no parece pertenecer a nadie.</> }
export default function CableComprometido() { return <StoryEscenario escenarioId="fisico/cable-comprometido" resumen="Cable desconocido — decide cómo actuar" contexto={contexto} nota="Un cable no es confiable solo porque parece servir para cargar." story={STORY} senales={SENALES} rule="<b>No conectes cables desconocidos.</b> Repórtalos o entrégalos para análisis sin exponer un dispositivo." restartLabel="Intentar de nuevo" cuandoTermina="El escenario termina al conectar, reportar o descartar el cable; llevártelo abre una segunda decisión." pista="Piensa qué pasos conectarían el cable a un equipo y cuáles mantienen la evidencia fuera de riesgo." /> }
