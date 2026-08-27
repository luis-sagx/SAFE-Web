import { useState, type ReactElement } from 'react'
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
    setShuffledChoices(shuffled(SCENARIO.choices))
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
