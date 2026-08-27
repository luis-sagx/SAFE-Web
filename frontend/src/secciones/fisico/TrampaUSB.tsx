import { useState } from 'react'
import { useNavigate } from 'react-router'
import EscenarioLayout from '../../components/EscenarioLayout'
import FlashOverlay from '../../components/ui/FlashOverlay'
import { useFlashTransition } from '../../hooks/useFlashTransition'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import dossierTheme from '../../styles/dossier-theme.module.css'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import styles from './Baiting.module.css'

type Level = 'safe' | 'warn' | 'danger'
type Phase = 'parking' | 'office' | 'resolved'

interface Choice {
  label: string
  level: Level
  risk: number
  feedback: string
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

const SCENE_ART_PARKING = ({ flash, onFlashClick }: { flash: boolean; onFlashClick: () => void }) => (
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
    {/* USB en el piso */}
    <rect x="140" y="145" width="30" height="18" fill="#1a1a1a" rx="3" />
    <rect x="168" y="145" width="12" height="8" fill="#c0c0c0" />
    {flash && <FlashSpark x={155} y={155} onClick={onFlashClick} />}
  </svg>
)

const SCENE_ART_OFFICE = ({ flash, onFlashClick }: { flash: boolean; onFlashClick: () => void }) => (
  <svg viewBox="0 0 400 220">
    {/* Fondo pared */}
    <rect width="400" height="180" fill="#d4cfc8" />
    {/* Piso */}
    <rect y="180" width="400" height="40" fill="#9a8f86" />

    {/* Escritorio */}
    <rect x="50" y="120" width="300" height="60" fill="#8a7a6a" stroke="#6a5a4a" strokeWidth="2" />

    {/* Computadora */}
    <g transform="translate(80, 70)">
      <rect x="0" y="0" width="80" height="50" fill="#1a1a1a" stroke="#333" strokeWidth="1.5" rx="2" />
      <rect x="2" y="2" width="76" height="46" fill="#0a0a2a" />
      <rect x="25" y="50" width="30" height="8" fill="#333" />
    </g>

    {/* USB prominente en el escritorio */}
    <rect x="240" y="130" width="35" height="20" fill="#1a1a1a" rx="3" />
    <rect x="275" y="130" width="15" height="10" fill="#c0c0c0" />
    <text x="257" y="145" fontFamily="Arial" fontSize="8" fill="#666" textAnchor="middle" fontWeight="bold">
      USB
    </text>

    {flash && <FlashSpark x={257} y={120} onClick={onFlashClick} />}
  </svg>
)

function ConsequenceArt({ level }: { level: Level }) {
  if (level === 'danger') {
    return (
      <svg viewBox="0 0 400 220">
        <rect width="400" height="220" fill="#1b232c" />
        <rect x="90" y="35" width="220" height="130" rx="6" fill="#0d1319" />
        <rect x="105" y="47" width="190" height="100" fill="#3d0f0f" />
        <rect className={styles.glitchBar} x="105" y="66" width="190" height="7" fill="#b4342f" opacity="0.65" />
        <rect className={styles.glitchBar} x="105" y="96" width="140" height="7" fill="#d63031" opacity="0.5" />
        <rect className={styles.glitchBar} x="140" y="118" width="150" height="7" fill="#b4342f" opacity="0.65" />
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
        <rect x="196" y="80" width="8" height="46" rx="4" fill="#ab6400" />
        <circle cx="200" cy="140" r="6" fill="#ab6400" />
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
        stroke="#16a34a"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const SCENARIO_PARKING = {
  location: 'Estacionamiento',
  time: '7:52 AM',
  object: 'Objeto: USB negro con etiqueta manuscrita',
  narrative:
    'Llegas temprano. Cerca de tu auto, en el suelo, hay un USB negro con una etiqueta escrita a mano: <em>"NÓMINA DICIEMBRE, CONFIDENCIAL"</em>. No hay nadie cerca para preguntar de quién es.',
  choices: [
    {
      label: 'Agarrar el USB y llevarlo a tu oficina',
      level: 'warn',
      risk: 8,
      feedback: '',
    },
    {
      label: 'Dejar el USB ahí y reportar a Seguridad',
      level: 'safe',
      risk: 0,
      feedback: '',
    },
  ],
}

const SCENARIO_OFFICE = {
  location: 'Tu oficina',
  time: '8:15 AM',
  object: 'Objeto: USB negro que encontraste en el estacionamiento',
  narrative:
    'Estás en tu oficina. El USB está sobre tu escritorio. Ahora tienes que decidir qué hacer con él.',
  choices: [
    {
      label: 'Conectarlo a tu laptop para ver qué contiene',
      level: 'danger',
      risk: 30,
      feedback:
        "Un USB desconocido puede ejecutar código automáticamente o simular un teclado para inyectar comandos (ataque tipo HID / 'Rubber Ducky'). La etiqueta 'confidencial' es el cebo diseñado para que lo abras tú mismo.",
    },
    {
      label: 'Llevarlo directo a IT para que lo analicen',
      level: 'safe',
      risk: 0,
      feedback:
        'Correcto. Ante cualquier dispositivo desconocido, el protocolo es entregarlo al área de IT para que lo analicen en un entorno controlado y aislado, nunca en tu propio equipo.',
    },
    {
      label: 'Escanear el USB con antivirus antes de abrirlo',
      level: 'danger',
      risk: 25,
      feedback:
        'Escanear con antivirus no te protege de todo: muchos ataques por USB usan ataques HID (simulan ser teclado y ejecutan comandos apenas se conecta). El daño ocurre antes de que termine el escaneo.',
    },
    {
      label: 'Guardarlo en tu gaveta para "revisarlo después"',
      level: 'warn',
      risk: 15,
      feedback:
        'Postergar la decisión no resuelve nada: el USB seguirá siendo una amenaza. Necesitas contactar a IT ahora, no dejarlo para después.',
    },
  ],
}

function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function verdictLabel(level: Level) {
  return level === 'safe' ? 'Decisión segura' : level === 'warn' ? 'Observación' : 'Riesgo detectado'
}

function stampWord(level: Level) {
  return level === 'safe' ? 'APROBADO' : level === 'warn' ? 'OBSERVACIÓN' : 'RIESGO'
}

function TrampaUSB() {
  const navigate = useNavigate()
  const run = useScenarioRun('fisico/trampa-usb')

  const [phase, setPhase] = useState<Phase>('parking')
  const [choicesShown, setChoicesShown] = useState(false)
  const [shuffledChoices, setShuffledChoices] = useState<Choice[]>([])
  const [revealPending, setRevealPending] = useState(false)
  const [resolved, setResolved] = useState<Resolved | null>(null)

  const flash = useFlashTransition()
  const stampFlash = useFlashTransition()

  const showFeedback = !!resolved && !revealPending
  const currentScenario = phase === 'parking' ? SCENARIO_PARKING : SCENARIO_OFFICE

  function onEmpezar() {
    setPhase('parking')
    setChoicesShown(false)
    setShuffledChoices([])
    setRevealPending(false)
    setResolved(null)
  }

  function handleNext() {
    navigate('/seccion/fisico')
  }

  function handleFlashClick() {
    setShuffledChoices(shuffled(currentScenario.choices as Choice[]))
    setChoicesShown(true)
  }

  function handleChoice(choice: Choice) {
    setRevealPending(true)
    run.recordDecision({ nivel: choice.level, riesgo: choice.risk })

    stampFlash.trigger(() => {
      if (phase === 'parking') {
        if (choice.label.includes('Agarrar')) {
          setRevealPending(false)
          setChoicesShown(false)
          setShuffledChoices([])
          setPhase('office')
        } else {
          setRevealPending(false)
          setResolved({ level: choice.level, feedback: 'Excelente decisión: no agarrar dispositivos desconocidos es la mejor opción. Reportar a Seguridad es el protocolo correcto.' })
          void run.finish({
            endingId: choice.level,
            outcome: 'CORRECTO',
          })
        }
      } else {
        setRevealPending(false)
        setResolved({ level: choice.level, feedback: choice.feedback })
        void run.finish({
          endingId: choice.level,
          outcome: choice.level === 'safe' ? 'CORRECTO' : choice.level === 'warn' ? 'PARCIAL' : 'INCORRECTO',
        })
      }
    }, 750)
  }

  const contexto: Contexto = {
    antes: (
      <>
        En tu oficina, los espacios comunes (estacionamiento, salas de descanso, escritorios, recepción)
        tienen varios puntos donde alguien podría dejar un dispositivo: un USB en el escritorio, un cable
        en un tomacorriente, un dispositivo de carga en la sala de descanso. Sabes que los ataques USB
        son comunes pero raramente los ves venir porque generalmente parecen inofensivos: están etiquetados
        de forma atractiva ({'"'}nómina{'"'}, {'"'}bonificación{'"'}) o promocional ({'"'}regalo de la
        empresa{'"'}).
      </>
    ),
    ahora:
      phase === 'parking' ? (
        <>
          <strong>Hoy temprano</strong> llegas al estacionamiento y encuentras un USB negro en el suelo
          cerca de tu auto. ¿Qué haces?
        </>
      ) : (
        <>
          <strong>En tu oficina</strong> tienes el USB sobre tu escritorio. Debes decidir qué hacer con él.
        </>
      ),
  }

  const pantalla = (
    <div className={`${dossierTheme.dossierTheme} ${styles.app}`}>
      <main className={styles.mainArea}>
        <div className={styles.sceneView}>
          <div className={styles.sceneMeta}>
            <span>{currentScenario.location.toUpperCase()}</span>
            <span>{currentScenario.time}</span>
          </div>
          <h3 className={styles.sceneLocation}>{currentScenario.location}</h3>

          <div className={styles.sceneCanvas}>
            {showFeedback ? (
              <ConsequenceArt level={resolved.level} />
            ) : phase === 'parking' ? (
              <SCENE_ART_PARKING flash={!choicesShown && !revealPending} onFlashClick={handleFlashClick} />
            ) : (
              <SCENE_ART_OFFICE flash={!choicesShown && !revealPending} onFlashClick={handleFlashClick} />
            )}
          </div>

          <p
            className={styles.sceneNarrative}
            dangerouslySetInnerHTML={{ __html: currentScenario.narrative }}
          />

          {!showFeedback && !choicesShown && !revealPending && (
            <span className={styles.flashHint}>Toca el destello ⚡ sobre la escena para inspeccionar</span>
          )}

          {showFeedback ? (
            <>
              <p className={styles.sceneObject}>{currentScenario.object}</p>
              <div className={styles.feedbackPanel}>
                <div className={styles.verdictRow}>
                  <span className={`${styles.badge} ${styles[resolved.level]}`}>
                    {verdictLabel(resolved.level)}
                  </span>
                </div>
                <p className={styles.feedbackText}>{resolved.feedback}</p>
                <button type="button" className={styles.nextBtn} onClick={handleNext}>
                  Siguiente
                </button>
              </div>
            </>
          ) : (
            (choicesShown || revealPending) && (
              <>
                <p className={styles.sceneObject}>{currentScenario.object}</p>
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
      </main>

      <FlashOverlay active={flash.active} />

      {revealPending && resolved && (
        <div className={`${styles.stampOverlay} ${stampFlash.active ? styles.show : ''}`}>
          <div className={`${styles.stamp} ${styles[resolved.level]}`}>{stampWord(resolved.level)}</div>
        </div>
      )}
    </div>
  )

  const nota = (
    <div className="text-base leading-relaxed text-body">
      <p>
        {phase === 'parking'
          ? 'Encuentras un USB abandonado en el estacionamiento. ¿Lo agarras?'
          : 'Ya tienes el USB en tu oficina. ¿Qué haces con él?'}
      </p>
    </div>
  )

  return (
    <EscenarioLayout
      escenarioId="fisico/trampa-usb"
      resumen="USB abandonado — decide qué hacer con él"
      contexto={contexto}
      nota={nota}
      identidad={[]}
      pantalla={pantalla}
      decision={null}
      ocultarDecision={true}
      onEmpezar={onEmpezar}
      dispositivo="escritorio"
    />
  )
}

export default TrampaUSB
