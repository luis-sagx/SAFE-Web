import { useState, type ReactElement } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import DossierHeader from '../../components/ui/DossierHeader'
import FlashOverlay from '../../components/ui/FlashOverlay'
import { useFlashTransition } from '../../hooks/useFlashTransition'
import dossierTheme from '../../styles/dossier-theme.module.css'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import styles from './Baiting.module.css'

type Level = 'safe' | 'warn' | 'danger'

interface Choice {
  label: string
  level: Level
  risk: number
  feedback: string
}

interface Scenario {
  location: string
  time: string
  object: string
  narrative: string
  choices: Choice[]
}

interface SceneArtProps {
  flash: boolean
  onFlashClick: () => void
}

interface Resolved {
  level: Level
  feedback: string
}

function FlashSpark({ x, y, onClick }: { x: number; y: number; onClick: () => void }) {
  return (
    <g className={styles.sceneFlash} transform={`translate(${x},${y})`} onClick={onClick}>
      <circle className={styles.flashPulseSpark} r="15" />
      <circle className={styles.flashDot} r="12" />
      <text className={styles.flashBoltText} y="1">
        ⚡
      </text>
    </g>
  )
}

const SCENE_ARTS: ((props: SceneArtProps) => ReactElement)[] = [
  ({ flash, onFlashClick }: SceneArtProps) => (
    <svg viewBox="0 0 400 220">
      <rect width="400" height="128" fill="#b7c8d6" />
      <rect y="128" width="400" height="92" fill="#6c7580" />
      <rect y="124" width="400" height="6" fill="#e7dcae" opacity="0.55" />
      <rect x="36" y="150" width="7" height="55" fill="#dcd3b8" />
      <rect x="150" y="150" width="7" height="55" fill="#dcd3b8" />
      <g transform="translate(190,138)">
        <rect x="0" y="20" width="140" height="34" rx="10" fill="#2c3e50" />
        <rect x="20" y="0" width="90" height="26" rx="8" fill="#34495e" />
        <circle cx="25" cy="56" r="12" fill="#1b232c" />
        <circle cx="115" cy="56" r="12" fill="#1b232c" />
      </g>
      <rect x="105" y="188" width="20" height="10" rx="2" fill="#1b232c" />
      <rect x="111" y="182" width="8" height="8" fill="#1b232c" />
      {flash && <FlashSpark x={118} y={192} onClick={onFlashClick} />}
    </svg>
  ),
  ({ flash, onFlashClick }: SceneArtProps) => (
    <svg viewBox="0 0 400 220">
      <rect width="400" height="220" fill="#ece0c4" />
      <rect y="160" width="400" height="60" fill="#cabb90" />
      <rect x="30" y="35" width="80" height="90" fill="#cfd6dc" opacity="0.55" />
      <ellipse cx="300" cy="160" rx="55" ry="16" fill="#a9744a" />
      <rect x="292" y="160" width="16" height="34" fill="#8a5d38" />
      <rect x="150" y="128" width="130" height="30" fill="#d8cba0" stroke="#9c8a5e" strokeWidth="2" />
      <rect x="170" y="105" width="26" height="24" fill="#5b4630" />
      <rect x="228" y="112" width="16" height="12" rx="2" fill="#3a3226" />
      <path d="M236 124 Q252 148 236 162" stroke="#2b2318" strokeWidth="3" fill="none" className={styles.glitchBar} />
      {flash && <FlashSpark x={236} y={158} onClick={onFlashClick} />}
    </svg>
  ),
  ({ flash, onFlashClick }: SceneArtProps) => (
    <svg viewBox="0 0 400 220">
      <rect width="400" height="220" fill="#eef1f2" />
      <rect y="55" width="400" height="10" fill="#d7dde1" />
      <rect x="40" y="130" width="320" height="16" fill="#cfae7c" />
      <rect x="40" y="112" width="320" height="20" fill="#e6cd9e" />
      <rect x="160" y="45" width="90" height="60" rx="4" fill="#1b232c" />
      <rect x="196" y="105" width="18" height="14" fill="#3a4552" />
      <rect x="150" y="130" width="70" height="14" rx="2" fill="#cfd6dc" />
      <path d="M300 40 L332 72" stroke="#2b2318" strokeWidth="4" />
      <circle cx="300" cy="40" r="8" fill="#2b2318" />
      <rect x="238" y="133" width="18" height="9" rx="2" fill="#1b232c" />
      <rect x="244" y="127" width="6" height="7" fill="#1b232c" />
      {flash && <FlashSpark x={247} y={138} onClick={onFlashClick} />}
    </svg>
  ),
  ({ flash, onFlashClick }: SceneArtProps) => (
    <svg viewBox="0 0 400 220">
      <rect width="400" height="220" fill="#e3ded0" />
      <rect x="30" y="120" width="140" height="40" rx="4" fill="#cbb98c" stroke="#9c8a5e" strokeWidth="2" />
      <rect x="60" y="102" width="40" height="20" fill="#8a7a58" />
      <g transform="translate(280,95)">
        <circle cx="0" cy="0" r="16" fill="#d8b48a" />
        <rect x="-20" y="16" width="40" height="60" rx="10" fill="#3a4552" />
        <rect x="-30" y="45" width="14" height="8" rx="2" fill="#e6cd9e" />
      </g>
      <rect x="245" y="140" width="16" height="9" rx="2" fill="#1b232c" />
      {flash && <FlashSpark x={253} y={145} onClick={onFlashClick} />}
    </svg>
  ),
]

function ConsequenceArt({ level }: { level: Level }) {
  if (level === 'danger') {
    return (
      <svg viewBox="0 0 400 220">
        <rect width="400" height="220" fill="#1b232c" />
        <rect x="90" y="35" width="220" height="130" rx="6" fill="#0d1319" />
        <rect x="105" y="47" width="190" height="100" fill="#3d0f0f" />
        <rect className={styles.glitchBar} x="105" y="66" width="190" height="7" fill="#c0453a" opacity="0.65" />
        <rect className={styles.glitchBar} x="105" y="96" width="140" height="7" fill="#e2574a" opacity="0.5" />
        <rect className={styles.glitchBar} x="140" y="118" width="150" height="7" fill="#c0453a" opacity="0.65" />
        <text
          x="200"
          y="105"
          textAnchor="middle"
          fontFamily="'IBM Plex Mono',monospace"
          fontSize="12"
          fill="#f4d9d6"
          className={styles.glitchText}
        >
          ⚠ ARCHIVO_MALICIOSO.EXE
        </text>
        <text x="200" y="128" textAnchor="middle" fontFamily="'IBM Plex Mono',monospace" fontSize="10" fill="#e8b9b3">
          acceso no autorizado detectado...
        </text>
        <rect x="70" y="165" width="260" height="16" rx="4" fill="#05080b" />
      </svg>
    )
  }
  if (level === 'warn') {
    return (
      <svg viewBox="0 0 400 220">
        <rect width="400" height="220" fill="#f6efdd" />
        <rect x="150" y="35" width="100" height="140" rx="8" fill="#fff9ec" stroke="#9c8a5e" strokeWidth="3" />
        <rect x="172" y="25" width="56" height="16" rx="4" fill="#9c8a5e" />
        <rect x="196" y="80" width="8" height="46" rx="4" fill="#d99b34" />
        <circle cx="200" cy="140" r="6" fill="#d99b34" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 400 220">
      <rect width="400" height="220" fill="#f6efdd" />
      <rect x="150" y="35" width="100" height="140" rx="8" fill="#fff9ec" stroke="#9c8a5e" strokeWidth="3" />
      <rect x="172" y="25" width="56" height="16" rx="4" fill="#9c8a5e" />
      <path
        d="M175 105 L198 128 L228 82"
        stroke="#3f8f74"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const SCENARIOS: Scenario[] = [
  {
    location: 'Estacionamiento',
    time: '7:52 AM',
    object: 'Objeto: USB negro con etiqueta manuscrita',
    narrative:
      'Llegas temprano. Cerca de tu auto, en el suelo, hay un USB negro con una etiqueta escrita a mano: <em>"NÓMINA DICIEMBRE, CONFIDENCIAL"</em>. No hay nadie cerca para preguntar de quién es.',
    choices: [
      {
        label: 'Conectarlo a tu laptop un momento, solo para ver de quién es',
        level: 'danger',
        risk: 30,
        feedback:
          "Un USB desconocido puede ejecutar código automáticamente o simular un teclado para inyectar comandos (ataque tipo HID / 'Rubber Ducky'). La etiqueta 'confidencial' no es un descuido: es el cebo diseñado para que lo abras tú mismo.",
      },
      {
        label: 'Llevarlo directo a Seguridad o IT',
        level: 'safe',
        risk: 0,
        feedback:
          'Correcto. Ante cualquier dispositivo desconocido, el protocolo es entregarlo al área de Seguridad o IT para que lo analicen en un entorno controlado y aislado, nunca en tu propio equipo.',
      },
      {
        label: 'Dejarlo ahí mismo, no es asunto tuyo',
        level: 'warn',
        risk: 12,
        feedback:
          "Mejor que conectarlo, pero no reportarlo deja la trampa activa para el siguiente compañero que pase por ahí. Repórtalo, no lo dejes 'para que alguien más decida'.",
      },
      {
        label: 'Conectarlo solo para escanearlo con el antivirus antes de decidir',
        level: 'danger',
        risk: 25,
        feedback:
          'Escanear con antivirus no te protege de todo: muchos ataques por USB no usan "archivos maliciosos" que un antivirus detecte, sino que el dispositivo se hace pasar por un teclado y ejecuta comandos apenas se conecta (ataque HID). Para cuando termina el escaneo, el daño ya pudo haberse hecho.',
      },
    ],
  },
  {
    location: 'Sala de descanso',
    time: '10:15 AM',
    object: 'Objeto: cable USB conectado al tomacorriente',
    narrative:
      'Vas a cargar tu celular y notas un cable USB ya conectado al enchufe público, sin nadie cerca reclamándolo. Se ve nuevo y en buen estado.',
    choices: [
      {
        label: 'Usarlo para cargar tu celular, se ve nuevo y en buen estado',
        level: 'danger',
        risk: 28,
        feedback:
          "Un cable 'olvidado' en un punto de carga público puede llevar un chip que roba datos o inyecta comandos apenas se conecta un dispositivo (juice jacking). Regla simple: solo tu propio cable, en tu propio cargador.",
      },
      {
        label: 'Llevártelo a tu escritorio, ahí te sirve más',
        level: 'warn',
        risk: 12,
        feedback:
          'Sigue siendo el mismo cable comprometido, solo que ahora en tu puesto de trabajo, con acceso potencial a más sistemas. El riesgo no desaparece por cambiar de enchufe.',
      },
      {
        label: 'Avisarle a mantenimiento sobre el cable',
        level: 'safe',
        risk: 0,
        feedback:
          'Correcto. Cualquier accesorio de carga no identificado en espacios comunes debe reportarse, nunca usarse, sin importar cuán nuevo se vea.',
      },
      {
        label: 'Usarlo solo para cargar el celular, sin pasar archivos',
        level: 'danger',
        risk: 22,
        feedback:
          "Existen cables modificados (tipo 'O.MG Cable') con un chip que puede inyectar comandos o robar datos alimentándose solo de la corriente del puerto, sin que tú transfieras nada a propósito. La intención de 'solo cargar' no depende de ti, depende del cable.",
      },
    ],
  },
  {
    location: 'Tu escritorio',
    time: '1:40 PM',
    object: 'Objeto: USB promocional con logo de feria tecnológica',
    narrative:
      'Vuelves del almuerzo y encuentras un USB promocional con el logo de una empresa que asistió a una feria tecnológica reciente, dejado sobre tu teclado. No recuerdas haberlo pedido.',
    choices: [
      {
        label: 'Conectarlo para ver qué contiene',
        level: 'danger',
        risk: 30,
        feedback:
          "Los USBs promocionales de eventos son un vector clásico: se regalan o 'olvidan' dispositivos infectados con la marca de una feria para bajar la guardia. Que tenga un logo conocido no lo hace confiable.",
      },
      {
        label: 'Guardarlo para revisarlo luego en tu computador personal',
        level: 'warn',
        risk: 15,
        feedback:
          'Esto solo traslada el riesgo a tu equipo personal y no resuelve el origen del dispositivo. El problema no es dónde lo conectas, sino que lo conectas sin verificar.',
      },
      {
        label: 'Preguntar en RRHH o IT si alguien dejó ese material',
        level: 'safe',
        risk: 0,
        feedback: 'Correcto. Verificar el origen por un canal interno confiable antes de conectar cualquier dispositivo es la respuesta adecuada.',
      },
      {
        label: 'Conectarlo porque venía en el material oficial del evento',
        level: 'danger',
        risk: 26,
        feedback:
          'Que algo lleve el logo de la feria o de una empresa conocida no garantiza nada: los atacantes imitan el material de marca (o incluso interceptan el material real) para que bajes la guardia. El origen aparente no reemplaza la verificación.',
      },
    ],
  },
  {
    location: 'Recepción',
    time: '4:20 PM',
    object: 'Objeto: memoria USB entregada por un visitante',
    narrative:
      'Un visitante en recepción te pide conectar su USB a tu computador de trabajo para "pasar rápido" una presentación, porque su laptop "no tiene lector". Parece apurado y agradable.',
    choices: [
      {
        label: 'Conectarlo a tu computador para ayudarlo rápido',
        level: 'danger',
        risk: 35,
        feedback:
          'Es el escenario de mayor riesgo: tu equipo de trabajo tiene acceso a más sistemas y datos que uno personal. La simpatía y la prisa del visitante son parte de la técnica, no una casualidad.',
      },
      {
        label: 'Decirle que no puedes ayudarlo con eso',
        level: 'warn',
        risk: 6,
        feedback: 'Protege el equipo, pero genera fricción innecesaria con un visitante que podría ser legítimo. Hay una forma de decir que no sin dejarlo varado.',
      },
      {
        label: 'Ofrecerle el equipo para visitas o pedirle que lo envíe por el canal oficial de la empresa',
        level: 'safe',
        risk: 0,
        feedback:
          'Correcto. Las empresas con buenas prácticas tienen equipos aislados para invitados o canales oficiales (correo corporativo, nube aprobada) precisamente para estos casos.',
      },
      {
        label: 'Conectarlo solo un segundo, para copiar el archivo y desconectarlo enseguida',
        level: 'danger',
        risk: 30,
        feedback:
          "El tiempo de conexión no es lo que te protege: un ataque tipo HID ejecuta sus comandos en los primeros milisegundos, antes de que puedas reaccionar. 'Solo un momento' es tiempo de sobra para comprometer el equipo.",
      },
    ],
  },
]

const ROOM_ZONES = [
  { idx: 0, x: 10, y: 70, width: 160, height: 440, ariaLabel: 'Estacionamiento', pinPos: [95, 300] },
  { idx: 3, x: 180, y: 70, width: 290, height: 220, ariaLabel: 'Recepción', pinPos: [410, 245] },
  { idx: 1, x: 470, y: 70, width: 290, height: 220, ariaLabel: 'Sala de descanso', pinPos: [645, 225] },
  { idx: 2, x: 180, y: 290, width: 290, height: 220, ariaLabel: 'Área administrativa', pinPos: [252, 362] },
]

function verdictLabel(level: Level) {
  return level === 'safe' ? 'Decisión segura' : level === 'warn' ? 'Observación' : 'Riesgo detectado'
}
function stampWord(level: Level) {
  return level === 'safe' ? 'APROBADO' : level === 'warn' ? 'OBSERVACIÓN' : 'RIESGO'
}
function pinSymbol(level: Level) {
  return level === 'safe' ? '✓' : level === 'warn' ? '!' : '✕'
}

function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function Baiting() {
  const { displayName, roleLabel } = useAuth()
  const run = useScenarioRun('fisico/baiting')

  const [view, setView] = useState<'map' | 'scene'>('map')
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [resolved, setResolved] = useState<Record<number, Resolved>>({})
  const [totalRisk, setTotalRisk] = useState(0)
  const [choicesShown, setChoicesShown] = useState(false)
  const [shuffledChoices, setShuffledChoices] = useState<Choice[]>([])
  const [revealPending, setRevealPending] = useState(false)
  const [showReport, setShowReport] = useState(false)

  const mapFlash = useFlashTransition()
  const stampFlash = useFlashTransition()


  const pct = Math.min(totalRisk, 100)
  const gaugeColor = pct <= 20 ? 'var(--safe)' : pct <= 55 ? 'var(--amber)' : 'var(--danger)'
  const resolvedCount = Object.keys(resolved).length

  function enterScene(idx: number) {
    mapFlash.trigger(() => {
      setActiveIdx(idx)
      setChoicesShown(false)
      setShuffledChoices([])
      setRevealPending(false)
      setView('scene')
    }, 190)
  }

  function backToMap() {
    mapFlash.trigger(() => {
      setView('map')
    }, 190)
  }

  function handleFlashClick() {
    setShuffledChoices(shuffled(SCENARIOS[activeIdx!]!.choices))
    setChoicesShown(true)
  }

  function handleChoice(choice: Choice) {
    const siguiente = { ...resolved, [activeIdx!]: { level: choice.level, feedback: choice.feedback } }

    setResolved(siguiente)
    setTotalRisk((prev) => prev + choice.risk)
    setRevealPending(true)
    run.recordDecision({ caso: activeIdx, nivel: choice.level, riesgo: choice.risk })

    if (Object.keys(siguiente).length === SCENARIOS.length) {
      const niveles = Object.values(siguiente).map((r) => r.level)
      void run.finish({
        endingId: niveles.join('-'),
        outcome: niveles.includes('danger')
          ? 'INCORRECTO'
          : niveles.includes('warn')
            ? 'PARCIAL'
            : 'CORRECTO',
      })
    }

    stampFlash.trigger(() => {
      setRevealPending(false)
    }, 750)
  }

  function handleRestart() {
    window.location.reload()
  }

  const activeScenario = activeIdx !== null ? (SCENARIOS[activeIdx] ?? null) : null
  const activeResolved = activeIdx !== null ? (resolved[activeIdx] ?? null) : null
  const showFeedback = !!activeResolved && !revealPending

  return (
    <div className={`${dossierTheme.dossierTheme} ${styles.app}`}>
      <DossierHeader
        caseLabel="CASO #0472"
        secondTab="TRAMPA USB"
        riskLabel="NIVEL DE RIESGO"
        gaugePercent={pct}
        gaugeValueText={`${pct}%`}
        gaugeColor={gaugeColor}
        participantName={displayName}
        participantRole={roleLabel}
      />

      <main className={styles.mainArea}>
        {view === 'map' && (
          <div>
            <div className={styles.instructionsBox}>
              <p className={styles.instructionsTitle}>Qué tienes que hacer</p>
              <ul className={styles.instructionsList}>
                <li>
                  En el plano de abajo hay 4 zonas marcadas con un pin numerado (1 a 4): Estacionamiento, Sala de
                  descanso, Tu escritorio y Recepción. Haz clic o presiona Enter sobre cada zona para entrar.
                </li>
                <li>
                  En cada zona vas a encontrar una situación distinta con un dispositivo USB o de carga de origen
                  desconocido (un USB tirado en el piso, un cable ya conectado, un USB promocional, la memoria de un
                  visitante).
                </li>
                <li>Toca el destello ⚡ sobre la escena para inspeccionar el objeto y ver las opciones disponibles.</li>
                <li>
                  Elige una de las opciones propuestas: cada una tiene una consecuencia distinta y suma un
                  porcentaje distinto al medidor de "NIVEL DE RIESGO" (arriba a la derecha), según qué tan segura o
                  arriesgada sea.
                </li>
                <li>
                  No hay forma de deshacer una decisión una vez tomada, luego de elegir, vuelve al plano con el
                  botón "← Volver al mapa" y entra a la siguiente zona pendiente (el pin cambia de color: pendiente,
                  segura, observación o riesgo).
                </li>
                <li>Cuando hayas resuelto los 4 casos se habilita el botón "Ver informe final", con el resumen de tus decisiones y el riesgo total acumulado.</li>
              </ul>
            </div>

            <p className={styles.mapCaption}>Plano, Oficinas administrativas · Induplast Andina S.A. · entra a cada lugar</p>

            <div className={styles.mapWrap}>
              <svg className={styles.officeMap} viewBox="0 0 800 560">
                {ROOM_ZONES.map((zone) => (
                  <rect
                    key={zone.idx}
                    className={styles.roomZone}
                    x={zone.x}
                    y={zone.y}
                    width={zone.width}
                    height={zone.height}
                    tabIndex={0}
                    role="button"
                    aria-label={zone.ariaLabel}
                    onClick={() => enterScene(zone.idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') enterScene(zone.idx)
                    }}
                  />
                ))}

                <rect x="10" y="70" width="160" height="440" className={styles.lot} />
                <line x1="90" y1="90" x2="90" y2="490" className={styles.lotLine} />
                <text x="20" y="55" className={styles.roomLabel}>
                  Estacionamiento
                </text>
                <rect x="55" y="300" width="70" height="34" rx="6" className={styles.furnitureFill} />
                <circle cx="68" cy="336" r="6" className={styles.furniture} />
                <circle cx="112" cy="336" r="6" className={styles.furniture} />

                <rect x="180" y="70" width="580" height="440" className={styles.wall} fill="none" />
                <line x1="470" y1="70" x2="470" y2="510" className={styles.wall} />
                <line x1="180" y1="290" x2="760" y2="290" className={styles.wall} />
                <line x1="180" y1="150" x2="180" y2="70" className={styles.wall} />
                <line x1="180" y1="290" x2="180" y2="200" className={styles.wall} />

                <text x="200" y="95" className={styles.roomLabel}>
                  Recepción
                </text>
                <rect x="205" y="200" width="110" height="38" rx="3" className={styles.furnitureFill} />
                <rect x="235" y="185" width="30" height="16" className={styles.furniture} />
                <circle cx="410" cy="245" r="14" className={styles.furnitureFill} />
                <rect x="398" y="258" width="24" height="6" className={styles.furniture} />
                <text x="386" y="278" className={styles.deskTag}>
                  Visitante
                </text>

                <text x="490" y="95" className={styles.roomLabel}>
                  Sala de descanso
                </text>
                <circle cx="670" cy="150" r="34" className={styles.furnitureFill} />
                <circle cx="670" cy="105" r="8" className={styles.furniture} />
                <circle cx="670" cy="195" r="8" className={styles.furniture} />
                <circle cx="628" cy="150" r="8" className={styles.furniture} />
                <circle cx="712" cy="150" r="8" className={styles.furniture} />
                <rect x="580" y="215" width="150" height="26" className={styles.furnitureFill} />
                <rect x="600" y="203" width="24" height="14" className={styles.furniture} />
                <line x1="645" y1="241" x2="645" y2="255" className={styles.furniture} />
                <line x1="638" y1="255" x2="652" y2="255" className={styles.furniture} />
                <text x="580" y="260" className={styles.deskTag}>
                  Tomacorriente
                </text>

                <text x="200" y="315" className={styles.roomLabel}>
                  Área administrativa
                </text>
                <rect x="205" y="335" width="95" height="55" rx="3" className={styles.furnitureFill} />
                <rect x="220" y="345" width="30" height="18" className={styles.furniture} />
                <text x="210" y="405" className={styles.deskTag}>
                  Tu escritorio
                </text>
                <rect x="330" y="335" width="90" height="55" rx="3" className={styles.furnitureFill} />
                <rect x="345" y="345" width="30" height="18" className={styles.furniture} />
                <rect x="205" y="420" width="95" height="55" rx="3" className={styles.furnitureFill} />
                <rect x="220" y="430" width="30" height="18" className={styles.furniture} />
                <rect x="330" y="420" width="90" height="55" rx="3" className={styles.furnitureFill} />
                <rect x="345" y="430" width="30" height="18" className={styles.furniture} />

                <text x="490" y="315" className={styles.roomLabel}>
                  Pasillo / Archivo
                </text>
                <rect x="560" y="340" width="150" height="120" className={styles.furniture} fill="none" strokeDasharray="4 4" />
                <text x="600" y="405" className={styles.deskTag}>
                  Estantes
                </text>

                {ROOM_ZONES.map((zone) => {
                  const res = resolved[zone.idx]
                  const [px, py] = zone.pinPos
                  return (
                    <g key={zone.idx} transform={`translate(${px},${py})`}>
                      {!res && <circle className={styles.pulse} r="14" />}
                      <g className={`${styles.pin} ${res ? styles[res.level] : ''}`}>
                        <circle className={styles.pinBase} r="12" />
                        <text className={styles.pinText} y="1">
                          {res ? pinSymbol(res.level) : zone.idx + 1}
                        </text>
                      </g>
                    </g>
                  )
                })}
              </svg>
            </div>

            <div className={styles.legend}>
              <span>
                <span className={`${styles.dot} ${styles.pending}`} />
                Pendiente
              </span>
              <span>
                <span className={`${styles.dot} ${styles.safe}`} />
                Segura
              </span>
              <span>
                <span className={`${styles.dot} ${styles.warn}`} />
                Observación
              </span>
              <span>
                <span className={`${styles.dot} ${styles.danger}`} />
                Riesgo
              </span>
            </div>

            <div className={styles.progressRow}>
              <span className={styles.progressText}>
                Casos revisados: {resolvedCount}/{SCENARIOS.length}
              </span>
              <button
                type="button"
                className={styles.reportBtn}
                disabled={resolvedCount < SCENARIOS.length}
                onClick={() => setShowReport(true)}
              >
                Ver informe final
              </button>
            </div>

            {showReport && resolvedCount === SCENARIOS.length && (
              <Report resolved={resolved} pct={pct} onRestart={handleRestart} />
            )}
          </div>
        )}

        {view === 'scene' && activeScenario && (
          <div className={styles.sceneView}>
            <button type="button" className={styles.backBtn} onClick={backToMap}>
              ← Volver al mapa
            </button>
            <div className={styles.sceneMeta}>
              <span>{activeScenario.location.toUpperCase()}</span>
              <span>{activeScenario.time}</span>
            </div>
            <h3 className={styles.sceneLocation}>{activeScenario.location}</h3>

            <div className={styles.sceneCanvas}>
              {showFeedback ? (
                <ConsequenceArt level={activeResolved.level} />
              ) : (
                (() => {
                  const SceneArt = SCENE_ARTS[activeIdx!]!
                  return <SceneArt flash={!choicesShown && !revealPending} onFlashClick={handleFlashClick} />
                })()
              )}
            </div>

            <p
              className={styles.sceneNarrative}
              dangerouslySetInnerHTML={{ __html: activeScenario.narrative }}
            />

            {!showFeedback && !choicesShown && !revealPending && (
              <span className={styles.flashHint}>Toca el destello ⚡ sobre la escena para inspeccionar</span>
            )}

            {showFeedback ? (
              <>
                <p className={styles.sceneObject}>{activeScenario.object}</p>
                <div className={styles.feedbackPanel}>
                  <div className={styles.verdictRow}>
                    <span className={`${styles.badge} ${styles[activeResolved.level]}`}>
                      {verdictLabel(activeResolved.level)}
                    </span>
                  </div>
                  <p className={styles.feedbackText}>{activeResolved.feedback}</p>
                  <button type="button" className={styles.nextBtn} onClick={backToMap}>
                    Volver al mapa
                  </button>
                </div>
              </>
            ) : (
              (choicesShown || revealPending) && (
                <>
                  <p className={styles.sceneObject}>{activeScenario.object}</p>
                  <div className={styles.choices}>
                    {shuffledChoices.map((choice) => (
                      <button
                        key={choice.label}
                        type="button"
                        className={styles.choiceBtn}
                        disabled={revealPending}
                        onClick={() => handleChoice(choice)}
                      >
                        {choice.label}
                      </button>
                    ))}
                  </div>
                </>
              )
            )}
          </div>
        )}
      </main>

      <FlashOverlay active={mapFlash.active} />

      {revealPending && activeResolved && (
        <div className={`${styles.stampOverlay} ${stampFlash.active ? styles.show : ''}`}>
          <div className={`${styles.stamp} ${styles[activeResolved.level]}`}>{stampWord(activeResolved.level)}</div>
        </div>
      )}

      <Link to="/seccion/fisico" className={styles.backLink}>
        ← Volver a la sección
      </Link>
    </div>
  )
}

function Report({
  resolved,
  pct,
  onRestart,
}: {
  resolved: Record<number, Resolved>
  pct: number
  onRestart: () => void
}) {
  const anyDanger = Object.values(resolved).some((r) => r.level === 'danger')
  let level: Level
  let title: string
  let summary: string
  if (anyDanger) {
    level = 'danger'
    title = 'Incidente de seguridad registrado'
    summary =
      'Al menos una decisión habría dado a un atacante acceso a tus sistemas. El común denominador del baiting es la curiosidad o la prisa, y verificar antes de conectar es la única defensa real.'
  } else if (pct <= 15) {
    level = 'safe'
    title = 'Protocolo ejemplar'
    summary =
      'Identificaste cada intento de baiting y seguiste el protocolo correcto: nunca conectar un dispositivo desconocido, siempre reportarlo por el canal adecuado.'
  } else {
    level = 'warn'
    title = 'Aprobado con observaciones'
    summary =
      'Evitaste conectar cualquier dispositivo desconocido, pero algunas decisiones dejaron el riesgo circulando en lugar de eliminarlo. Reportar siempre es mejor que ignorar o reubicar el problema.'
  }

  return (
    <div className={styles.report} style={{ marginTop: 20, borderTop: '1px dashed var(--paper-edge)', paddingTop: 18 }}>
      <span className={`${styles.reportStamp} ${styles[level]}`}>CASO CERRADO</span>
      <h2>{title}</h2>
      <p className={styles.summary}>
        Nivel de riesgo final: <strong>{pct}%</strong>. {summary}
      </p>
      <div>
        {SCENARIOS.map((s, i) => (
          <div key={s.location} className={styles.recapItem}>
            <span className={styles.recapLoc}>{s.location}</span>
            <span className={`${styles.recapTag} ${styles[resolved[i]!.level]}`}>{stampWord(resolved[i]!.level)}</span>
          </div>
        ))}
      </div>
      <button type="button" className={styles.restartBtn} onClick={onRestart}>
        Reiniciar simulación
      </button>
    </div>
  )
}

export default Baiting
