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
      '<b>El celular se abre sin clave</b>, con todas tus apps a la vista. Un PIN, patrón o huella le habría costado tiempo al ladrón.',
  },
  {
    id: 'tiempo',
    targetId: 'moto',
    texto:
      '<b>Vaciaron una cuenta en menos de 20 minutos</b> en un caso real de Guayaquil. Cada minuto sin bloquear cuenta.',
  },
  {
    id: 'sesiones',
    targetId: 'mano-vacia',
    texto:
      'El ladrón se lleva <b>apps con sesión abierta</b> y el chip que <b>recibe tus códigos del banco</b>. El bloqueo cuenta desde que avisas.',
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
      'El banco rechazó dos transferencias a los 15 minutos: tus canales ya estaban bloqueados. La operadora suspendió la línea y el equipo en la misma llamada.',
  },
  e_casa: {
    kind: 'bad',
    view: STREET,
    verdict: 'Vaciaron tu cuenta',
    outcome:
      'Sin clave, abrieron la app del banco como si fueras tú. En los 40 minutos de camino salieron tres transferencias, aprobadas con los códigos que seguían llegando a tu chip.',
  },
  e_denuncia_primero: {
    kind: 'partial',
    view: STREET,
    verdict: 'Respuesta incompleta',
    outcome:
      'La denuncia hace falta, pero mientras esperabas turno salió una transferencia con la banca móvil todavía abierta. Bloquear primero habría evitado esa pérdida.',
  },
  e_solo_chip: {
    kind: 'partial',
    view: STREET,
    verdict: 'Respuesta incompleta',
    outcome:
      'Dejaron de llegar los códigos por SMS, pero sin clave, las apps con la sesión abierta siguieron funcionando con cualquier WiFi. Hicieron un pago antes de que llamaras al banco.',
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
      rule="<b>Si te roban el celular, primero el banco.</b> Bloquea la banca móvil, luego suspende línea y equipo con tu operadora, y denuncia después."
      restartLabel="Intentar de nuevo"
      cuandoTermina="Cuando elijas qué haces primero después del robo."
      pista="El ladrón no solo tiene el equipo: tiene tus apps abiertas y el chip que recibe los códigos. Piensa qué cierra más rápido el acceso a tu dinero."
    />
  )
}
