import { useState } from 'react'
import { useNavigate } from 'react-router'
import EscenarioLayout from '../../components/EscenarioLayout'
import FlashOverlay from '../../components/ui/FlashOverlay'
import { useFlashTransition } from '../../hooks/useFlashTransition'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import dossierTheme from '../../styles/dossier-theme.module.css'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import { shuffle } from '../../utils/shuffle'
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
    {/* Fondo de oficina */}
    <rect width="400" height="150" fill="#e8e4dc" />
    <rect y="150" width="400" height="70" fill="#b0a89a" />

    {/* Puerta */}
    <rect x="20" y="80" width="50" height="70" fill="#8a7a6a" stroke="#6a5a4a" strokeWidth="2" />
    <circle cx="68" cy="115" r="4" fill="#c0c0c0" />

    {/* Técnico con herramientas */}
    <circle cx="150" cy="70" r="14" fill="#d4a574" />

    {/* Cuerpo con uniforme */}
    <rect x="138" y="84" width="24" height="35" fill="#3a5a7a" rx="2" />

    {/* Texto en la camiseta */}
    <text x="150" y="108" textAnchor="middle" fontFamily="Arial" fontSize="8" fontWeight="bold" fill="#ffcc00" textDecoration="none">
      TECNICO
    </text>

    {/* Brazos */}
    <rect x="125" y="88" width="13" height="8" fill="#d4a574" rx="3" />
    <rect x="162" y="88" width="13" height="8" fill="#d4a574" rx="3" />
    {/* Piernas */}
    <rect x="142" y="119" width="6" height="30" fill="#2a2a2a" />
    <rect x="152" y="119" width="6" height="30" fill="#2a2a2a" />

    {/* Herramientas en mano */}
    <rect x="165" y="86" width="4" height="20" fill="#888888" />
    <rect x="169" y="85" width="3" height="22" fill="#888888" />

    {/* Badge/ID */}
    <rect x="140" y="90" width="12" height="16" fill="#ffcc00" stroke="#cc9900" strokeWidth="1" />

    {/* Indicador de interacción */}
    {flash && <FlashSpark x={150} y={90} onClick={onFlashClick} />}
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
          ⚠ ACCESO_NO_AUTORIZADO
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
  location: 'Entrada de oficina',
  time: '3:15 PM',
  object: 'Objeto: técnico de servicios con herramientas',
  narrative:
    'Un técnico entra a tu piso diciendo que viene a revisar "el aire acondicionado" y "hacer un mantenimiento rutinario de cableado". Lleva herramientas y un badge de "servicios", pero no lo reconoces. Dice que fue autorizado pero nadie de tu equipo lo sabe.',
  choices: [
    {
      label: 'Dejarlo pasar para que haga su trabajo, no quieres retrasos',
      level: 'danger',
      risk: 35,
      feedback:
        'Es un vector de ataque clásico: alguien que parece legítimo (uniforme, badge, herramientas) entra con una historia plausible. Tener acceso físico al cableado, servidores o equipos de red es tan peligroso como acceso digital. Verificar siempre es lo primero.',
    },
    {
      label: 'Preguntarle detalles pero dejarlo trabajar si suena convincente',
      level: 'warn',
      risk: 18,
      feedback:
        'Mejor que dejarlo pasar sin preguntar, pero verificar la autorización es insuficiente. Un atacante entrenado responderá las preguntas correctamente. El protocolo debe ser: verificar por un canal oficial, no solo charla.',
    },
    {
      label: 'Pedirle que espere mientras verificas con IT o recepción',
      level: 'safe',
      risk: 0,
      feedback:
        'Correcto. Cualquier persona desconocida, sin importar qué uniforme o badge use, debe verificarse antes de tener acceso a áreas restringidas o equipos. "Hacer esperar" es la forma educada de aplicar el protocolo.',
    },
    {
      label: 'Llamar a seguridad para que lo acompañe, pero después dejarlo solo',
      level: 'warn',
      risk: 12,
      feedback:
        'Acompañarlo es correcto, pero dejarlo solo después anula esa protección. El protocolo completo requiere escolta continua de personal no autorizado, no solo el punto de entrada.',
    },
  ],
}

function verdictLabel(level: Level) {
  return level === 'safe' ? 'Decisión segura' : level === 'warn' ? 'Observación' : 'Riesgo detectado'
}

function stampWord(level: Level) {
  return level === 'safe' ? 'APROBADO' : level === 'warn' ? 'OBSERVACIÓN' : 'RIESGO'
}

function TecnicoImpostor() {
  const navigate = useNavigate()
  const run = useScenarioRun('fisico/tecnico-impostor')

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
    setShuffledChoices(shuffle(SCENARIO.choices as Choice[]))
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
        Los técnicos de "servicios rutinarios" (aire acondicionado, mantenimiento, limpieza) son un vector de ataque
        común. Tienen razones plausibles para estar en áreas restringidas, uniforme y badge que parecen legítimos, y
        la mayoría de gente no quiere confrontar o retrasar el trabajo. Es el pretexto perfecto.
      </>
    ),
    ahora: (
      <>
        <strong>Por la tarde</strong> un técnico entra a tu piso diciendo que viene a revisar el aire acondicionado
        y hacer "mantenimiento rutinario de cableado". Lleva herramientas y un badge de servicios. Dice que fue
        autorizado, pero nadie de tu equipo lo sabe.
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
      <p>Un técnico desconocido dice que viene a hacer mantenimiento rutinario. ¿Qué haces?</p>
    </div>
  )

  return (
    <EscenarioLayout
      escenarioId="fisico/tecnico-impostor"
      resumen="Técnico de servicios — ¿lo dejas entrar?"
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

export default TecnicoImpostor
