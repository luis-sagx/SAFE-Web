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

const SCENE_ART = ({ flash, onFlashClick }: { flash: boolean; onFlashClick: () => void }) => (
  <svg viewBox="0 0 400 220">
    {/* Fondo y piso */}
    <rect width="400" height="150" fill="#e8e4dc" />
    <rect y="150" width="400" height="70" fill="#b0a89a" />
    <line x1="0" y1="150" x2="400" y2="150" stroke="#d0c8ba" strokeWidth="2" />

    {/* Escritorio de recepción */}
    <rect x="250" y="110" width="130" height="40" fill="#8a7a6a" stroke="#6a5a4a" strokeWidth="2" />
    <rect x="255" y="90" width="120" height="25" fill="#a8988a" />

    {/* Visitante - persona simple */}
    <circle cx="80" cy="70" r="15" fill="#d4a574" />
    {/* Cuerpo */}
    <rect x="65" y="85" width="30" height="40" fill="#4a6b8a" rx="2" />
    {/* Brazos */}
    <rect x="50" y="90" width="15" height="8" fill="#d4a574" rx="4" />
    <rect x="95" y="90" width="15" height="8" fill="#d4a574" rx="4" />
    {/* Piernas */}
    <rect x="70" y="125" width="8" height="25" fill="#3a3a3a" />
    <rect x="82" y="125" width="8" height="25" fill="#3a3a3a" />

    {/* USB en la mano del visitante */}
    <rect x="105" y="88" width="20" height="12" fill="#2a2a2a" rx="2" />
    <rect x="110" y="83" width="10" height="8" fill="#c0c0c0" rx="1" />

    {/* Receptionist detrás del escritorio */}
    <circle cx="315" cy="80" r="12" fill="#d4a574" />
    <rect x="305" y="92" width="20" height="35" fill="#6a7a9a" rx="2" />
    <rect x="295" y="98" width="10" height="6" fill="#d4a574" rx="2" />
    <rect x="325" y="98" width="10" height="6" fill="#d4a574" rx="2" />

    {/* Indicador de interacción */}
    {flash && <FlashSpark x={100} y={100} onClick={onFlashClick} />}
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
          ⚠ SISTEMA_COMPROMETIDO
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

const SCENARIO = {
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

function ImpostorTecnico() {
  const navigate = useNavigate()
  const run = useScenarioRun('fisico/impostor-tecnico')

  const [choicesShown, setChoicesShown] = useState(false)
  const [shuffledChoices, setShuffledChoices] = useState<Choice[]>([])
  const [revealPending, setRevealPending] = useState(false)
  const [resolved, setResolved] = useState<Resolved | null>(null)

  const flash = useFlashTransition()
  const stampFlash = useFlashTransition()

  const showFeedback = !!resolved && !revealPending

  function onEmpezar() {
    setChoicesShown(false)
    setShuffledChoices([])
    setRevealPending(false)
    setResolved(null)
  }

  function handleNext() {
    navigate('/seccion/fisico')
  }

  function handleFlashClick() {
    setShuffledChoices(shuffled(SCENARIO.choices as Choice[]))
    setChoicesShown(true)
  }

  function handleChoice(choice: Choice) {
    setRevealPending(true)
    run.recordDecision({ nivel: choice.level, riesgo: choice.risk })

    stampFlash.trigger(() => {
      setRevealPending(false)
      setResolved({ level: choice.level, feedback: choice.feedback })
      void run.finish({
        endingId: choice.level,
        outcome: choice.level === 'safe' ? 'CORRECTO' : choice.level === 'warn' ? 'PARCIAL' : 'INCORRECTO',
      })
    }, 750)
  }

  const contexto: Contexto = {
    antes: (
      <>
        La ingeniería social en recepción es común: alguien que parece ser un visitante legítimo puede
        pedir usar tu equipo "rápidamente". La presión social (simpatía, urgencia) es parte de la técnica.
        Los atacantes aprovechan que queremos ser amables y serviciales.
      </>
    ),
    ahora: (
      <>
        <strong>A última hora de la tarde</strong> un visitante en recepción te pide un favor: conectar
        su USB a tu computador para mostrar una presentación porque su laptop "no tiene lector". Se ve
        apurado pero amable, y solo sería un momento.
      </>
    ),
  }

  const pantalla = (
    <div className={`${dossierTheme.dossierTheme} ${styles.app}`}>
      <main className={styles.mainArea}>
        <div className={styles.sceneView}>
          <div className={styles.sceneMeta}>
            <span>{SCENARIO.location.toUpperCase()}</span>
            <span>{SCENARIO.time}</span>
          </div>
          <h3 className={styles.sceneLocation}>{SCENARIO.location}</h3>

          <div className={styles.sceneCanvas}>
            {showFeedback ? (
              <ConsequenceArt level={resolved.level} />
            ) : (
              <SCENE_ART flash={!choicesShown && !revealPending} onFlashClick={handleFlashClick} />
            )}
          </div>

          <p
            className={styles.sceneNarrative}
            dangerouslySetInnerHTML={{ __html: SCENARIO.narrative }}
          />

          {!showFeedback && !choicesShown && !revealPending && (
            <span className={styles.flashHint}>Toca el destello ⚡ sobre la escena para inspeccionar</span>
          )}

          {showFeedback ? (
            <>
              <p className={styles.sceneObject}>{SCENARIO.object}</p>
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
                <p className={styles.sceneObject}>{SCENARIO.object}</p>
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
      <p>Un visitante te pide un favor que suena inofensivo. Debes decidir cómo responder sin comprometer la seguridad de tu equipo.</p>
    </div>
  )

  return (
    <EscenarioLayout
      escenarioId="fisico/impostor-tecnico"
      resumen="Visitante pide usar tu computador — ¿qué haces?"
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

export default ImpostorTecnico
