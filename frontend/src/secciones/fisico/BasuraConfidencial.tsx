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
    {/* Fondo zona común */}
    <rect width="400" height="220" fill="#e8e4dc" />
    <rect y="160" width="400" height="60" fill="#b0a89a" />

    {/* Pared */}
    <line x1="0" y1="160" x2="400" y2="160" stroke="#d0c8ba" strokeWidth="2" />

    {/* Bote de basura grande */}
    <g transform="translate(200, 130)">
      {/* Cuerpo principal */}
      <rect x="-50" y="-40" width="100" height="80" fill="#4a4a4a" stroke="#2a2a2a" strokeWidth="2" rx="4" />

      {/* Tapa */}
      <ellipse cx="0" cy="-40" rx="52" ry="12" fill="#5a5a5a" stroke="#3a3a3a" strokeWidth="1.5" />

      {/* Asa */}
      <path d="M-30 -40 Q-30 -60 30 -60" stroke="#6a6a6a" strokeWidth="3" fill="none" />

      {/* Documentos visibles dentro */}
      <rect x="-40" y="-25" width="35" height="25" fill="#f5f5f5" stroke="#999" strokeWidth="1" transform="rotate(-15 -22 -12)" />
      <line x1="-40" y1="-20" x2="-5" y2="-20" stroke="#ccc" strokeWidth="1" transform="rotate(-15 -22 -12)" />
      <line x1="-40" y1="-15" x2="-5" y2="-15" stroke="#ccc" strokeWidth="1" transform="rotate(-15 -22 -12)" />

      <rect x="5" y="-20" width="35" height="25" fill="#f5f5f5" stroke="#999" strokeWidth="1" transform="rotate(8 22 -7)" />
      <line x1="5" y1="-15" x2="40" y2="-15" stroke="#ccc" strokeWidth="1" transform="rotate(8 22 -7)" />
      <line x1="5" y1="-10" x2="40" y2="-10" stroke="#ccc" strokeWidth="1" transform="rotate(8 22 -7)" />

      {/* Documento parcialmente visible en la parte de arriba */}
      <rect x="-30" y="-35" width="30" height="15" fill="#f0f0f0" stroke="#888" strokeWidth="1" />
      <text x="-15" y="-26" fontFamily="Arial" fontSize="6" fill="#666" textAnchor="middle" fontWeight="bold">
        SALARIOS
      </text>
    </g>

    {/* Indicador de interacción */}
    {flash && <FlashSpark x={200} y={100} onClick={onFlashClick} />}
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
        <text x="200" y="105" textAnchor="middle" fontFamily="'IBM Plex Mono',monospace" fontSize="12" fill="#f4d9d6" className={styles.glitchText}>
          ⚠ DATOS_EXPUESTOS
        </text>
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
      <path d="M175 105 L198 128 L228 82" stroke="#16a34a" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const SCENARIO = {
  location: 'Zona común',
  time: '11:30 AM',
  object: 'Objeto: papelera con documentos confidenciales',
  narrative:
    'Vas a la zona de descanso y ves la papelera llena de documentos impresos. Están rotos pero legibles: evaluaciones de desempeño, salarios, y extractos bancarios. Alguien más podría llegar, o la persona de limpieza que vuelve en una hora.',
  choices: [
    {
      label: 'Dejarlos ahí, no es tu responsabilidad',
      level: 'danger',
      risk: 25,
      feedback:
        'Los documentos siguen en la papelera, donde cualquiera — personal de limpieza, visitantes, o compañeros curiosos — puede verlos. Aunque estén rotos, los salarios, evaluaciones y datos bancarios son legibles. Es una exposición de información clasificada.',
    },
    {
      label: 'Sacarlos y guardarlos en un armario privado',
      level: 'warn',
      risk: 12,
      feedback:
        'Sacaste documentos de la basura y los guardaste. Aunque tenías una intención defensiva, acabas de llevar información confidencial de personas que no son tú a un lugar privado. Eso es potencial acceso no autorizado y posesión de documentos clasificados.',
    },
    {
      label: 'Destruir los documentos usando la trituradora',
      level: 'safe',
      risk: 0,
      feedback:
        'Correcto. Llevar los documentos a la trituradora y destruirlos fue la acción defensiva correcta. Sacaste datos confidenciales de una zona común donde cualquiera podría encontrarlos, y los destruiste adecuadamente. Es la forma segura de manejar documentos clasificados encontrados en basura.',
    },
    {
      label: 'Reportar a tu supervisor para que investigue',
      level: 'safe',
      risk: 0,
      feedback:
        'También correcto. Reportar a tu supervisor (o directamente a Seguridad) que hay documentos confidenciales en la basura común permite que se investigue quién los tiró sin autorización. Es un incidente de seguridad que debe documentarse y prevenirse.',
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

function BasuraConfidencial() {
  const navigate = useNavigate()
  const run = useScenarioRun('fisico/basura-confidencial')

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
        Los documentos confidenciales en basura común es un riesgo real y frecuente. Salarios, evaluaciones,
        datos bancarios, contratos — se desechan sin destruir apropiadamente. Cualquiera en la zona común
        (personal de limpieza, visitantes, compañeros) puede acceder a información sensible de otros empleados.
      </>
    ),
    ahora: (
      <>
        <strong>A media mañana</strong> vas a la zona de descanso y encuentras la papelera llena de documentos
        impresos. Aunque están rotos, son legibles: evaluaciones de desempeño, salarios, y extractos bancarios
        de varios compañeros. La persona de limpieza vuelve en una hora.
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

          <p className={styles.sceneNarrative} dangerouslySetInnerHTML={{ __html: SCENARIO.narrative }} />

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
      <p>Encuentras documentos confidenciales en la papelera de zona común. ¿Qué haces?</p>
    </div>
  )

  return (
    <EscenarioLayout
      escenarioId="fisico/basura-confidencial"
      resumen="Basura con documentos confidenciales — ¿qué haces?"
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

export default BasuraConfidencial
