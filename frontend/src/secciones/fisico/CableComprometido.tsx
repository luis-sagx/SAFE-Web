import ScenarioStory, { type ScreenNode } from '../../components/StoryEscenario'
import type { Context } from '../../components/ui/ContextoEscenario'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Signal } from '../../components/ui/PanelVeredicto'
import type { Story } from '../../hooks/useStoryEngine'
import phoneTheftImg from '../../assets/escenarios/fisico/robo-celular.webp'

// v2 era "juice jacking" en una estación de carga: no hay ningún caso real
// documentado. Ahora es la toma de la banca móvil tras el robo del celular,
// con casos de Guayaquil (El Universo, 2022): una cuenta vaciada en menos de
// 20 minutos y más de $12.000 transferidos en una hora. Lo que se mide es qué
// haces primero: el banco bloquea desde la hora del aviso (Asobanca) y la
// operadora suspende la línea y bloquea el IMEI en la misma llamada
// (ARCOTEL). El id y el archivo no cambian, para conservar el historial.
const STREET: ScreenView = {
  kind: 'escena',
  src: phoneTheftImg,
  alt: 'En una parada de bus al anochecer, tu mano vacía sigue levantada mientras dos hombres en moto se alejan; el de atrás levanta tu celular, que muestra la pantalla de inicio con todas las apps',
  zonas: [
    { id: 'celular-desbloqueado', x: '66.5%', y: '4%', ancho: '9%', alto: '17.5%' },
    { id: 'moto', x: '57%', y: '24%', ancho: '41%', alto: '75.5%' },
    { id: 'mano-vacia', x: '0.5%', y: '45%', ancho: '36%', alto: '54.5%' },
  ],
}

const SIGNALS: Signal[] = [
  {
    id: 'sin-clave',
    targetId: 'celular-desbloqueado',
    texto:
      'Mira la pantalla: <b>se abre sin clave</b>, con todas tus apps a la vista. En el caso de Guayaquil el celular no tenía bloqueo y los datos del banco estaban en las notas. Un PIN, un patrón o tu huella le cuestan al ladrón el tiempo que tú necesitas para bloquear todo.',
  },
  {
    id: 'tiempo',
    targetId: 'moto',
    texto:
      'Cada minuto cuenta: en un caso de Guayaquil <b>vaciaron la cuenta en menos de 20 minutos</b>, y en otro transfirieron más de $12.000 en una hora.',
  },
  {
    id: 'sesiones',
    targetId: 'mano-vacia',
    texto:
      'El ladrón no solo se lleva el equipo: se lleva tus <b>apps con la sesión abierta</b> y el chip que <b>recibe los códigos de verificación</b> del banco. El banco bloquea tus canales desde la hora en que avisas.',
  },
]

const STORY: Story<ScreenNode> = {
  n1: {
    kind: 'scene',
    view: STREET,
    choices: [
      {
        label: 'Pedir un teléfono prestado y llamar primero a tu banco para bloquear la banca móvil; después, a tu operadora para suspender la línea y bloquear el equipo',
        goto: 'e_banco_primero',
      },
      { label: 'Ir primero a casa a calmarte y llamar al banco desde ahí', goto: 'e_casa' },
      { label: 'Ir directo a la Fiscalía a poner la denuncia', goto: 'e_denuncia_primero' },
      { label: 'Llamar solo a la operadora para bloquear el chip', goto: 'e_solo_chip' },
    ],
  },
  e_banco_primero: {
    kind: 'good',
    view: STREET,
    verdict: 'Cuentas protegidas',
    outcome:
      'A los 15 minutos del robo intentaron dos transferencias y el banco las rechazó: tus canales ya estaban bloqueados. La operadora suspendió la línea y bloqueó el equipo en la misma llamada. Al día siguiente avisaste a TI para cerrar la sesión del correo del trabajo y pusiste la denuncia. Tu celular nuevo ya tiene clave de bloqueo.',
  },
  e_casa: {
    kind: 'bad',
    view: STREET,
    verdict: 'Vaciaron tu cuenta',
    outcome:
      'Sin clave de bloqueo, abrieron la app del banco como si fueras tú. Durante los 40 minutos de camino salieron tres transferencias, aprobadas con los códigos que seguían llegando a tu chip. Cuando por fin llamaste, el banco bloqueó desde esa hora: lo anterior quedó como un reclamo largo e incierto.',
  },
  e_denuncia_primero: {
    kind: 'partial',
    view: STREET,
    verdict: 'Respuesta incompleta',
    outcome:
      'La denuncia hace falta, pero mientras esperabas turno la banca móvil seguía abierta y salió una transferencia. Bloquear primero y denunciar después habría evitado ese dinero perdido.',
  },
  e_solo_chip: {
    kind: 'partial',
    view: STREET,
    verdict: 'Respuesta incompleta',
    outcome:
      'Dejaron de llegar los códigos por SMS, pero el celular no tenía clave y las apps con la sesión abierta siguieron funcionando con cualquier WiFi. Hicieron un pago antes de que llamaras al banco.',
  },
}

const context: Context = {
  antes:
    'En tu celular tienes la app del banco, el correo del trabajo y los chats con tus compañeros. No le pusiste clave de bloqueo: desbloquearlo a cada rato te parecía una molestia.',
  ahora: (
    <>
      <strong>Jueves, 7 de la noche</strong>, esperando el bus en la avenida. Dos hombres en moto suben
      por la vereda y el de atrás te arranca el celular de la mano. En segundos se pierden entre el
      tráfico.
    </>
  ),
}

export default function CompromisedCable() {
  return (
    <ScenarioStory
      escenarioId="fisico/cable-comprometido"
      resumen="Camino a casa, te roban el celular"
      contexto={context}
      nota="Mira la escena con calma antes de decidir."
      story={STORY}
      senales={SIGNALS}
      rule="<b>Ponle clave a tu celular y, si te lo roban, primero el banco.</b> Un PIN, patrón o huella frena al ladrón; después bloquea la banca móvil por la línea oficial, luego suspende la línea y el equipo con tu operadora, avisa a TI si tenías cuentas del trabajo y denuncia."
      restartLabel="Intentar de nuevo"
      cuandoTermina="Cuando elijas qué haces primero después del robo."
      pista="El ladrón no solo tiene el equipo: tiene tus apps abiertas y el chip que recibe los códigos. Piensa qué cierra más rápido el acceso a tu dinero."
    />
  )
}
