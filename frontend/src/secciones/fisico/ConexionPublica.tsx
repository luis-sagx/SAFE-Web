import { useState } from 'react'
import { useNavigate } from 'react-router'
import EscenarioLayout from '../../components/EscenarioLayout'
import FlashOverlay from '../../components/ui/FlashOverlay'
import { useFlashTransition } from '../../hooks/useFlashTransition'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import dossierTheme from '../../styles/dossier-theme.module.css'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import { shuffle } from '../../utils/shuffle'
import { outcomeForLevel, stampForLevel, verdictForLevel } from '../../utils/verdict'
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

const SceneArt = ({ flash, onFlashClick }: { flash: boolean; onFlashClick: () => void }) => (
  <svg viewBox="0 0 400 220">
    {/* Pared fondo */}
    <rect width="400" height="220" fill="#f5e6d3" />

    {/* Piso */}
    <rect y="160" width="400" height="60" fill="#d4c5b0" />

    {/* Mesa */}
    <rect x="30" y="110" width="150" height="60" fill="#8b6f47" stroke="#654321" strokeWidth="2" />
    {/* Patas de la mesa */}
    <rect x="50" y="170" width="12" height="30" fill="#654321" />
    <rect x="148" y="170" width="12" height="30" fill="#654321" />

    {/* Persona sentada */}
    <circle cx="90" cy="70" r="14" fill="#d4a574" />
    {/* Cuerpo */}
    <rect x="78" y="84" width="24" height="28" fill="#4a5f8a" stroke="#2c3e50" strokeWidth="1" />

    {/* Computadora/Laptop en la mesa */}
    <g transform="translate(100, 115)">
      <rect x="0" y="0" width="60" height="40" fill="#2c3e50" stroke="#1a1a1a" strokeWidth="2" rx="3" />
      <rect x="5" y="5" width="50" height="28" fill="#1a1a1a" />
      <rect x="15" y="36" width="30" height="4" fill="#654321" />
    </g>

    {/* Letrero "Internet Café Gratis" en la pared */}
    <rect x="250" y="40" width="140" height="50" fill="#8b6f47" stroke="#654321" strokeWidth="2" rx="4" />
    <text x="320" y="62" textAnchor="middle" fontFamily="Arial" fontSize="14" fontWeight="bold" fill="#f5f5f5">
      Internet Café
    </text>
    <text x="320" y="80" textAnchor="middle" fontFamily="Arial" fontSize="12" fill="#f5f5f5">
      GRATIS
    </text>

    {/* Router WiFi en la estantería */}
    <g transform="translate(310, 140)">
      {/* Caja del router */}
      <rect x="-20" y="0" width="40" height="25" fill="#333" stroke="#1a1a1a" strokeWidth="1" rx="2" />
      {/* Antenas */}
      <rect x="-18" y="-12" width="3" height="12" fill="#555" />
      <rect x="-8" y="-12" width="3" height="12" fill="#555" />
      <rect x="2" y="-12" width="3" height="12" fill="#555" />
      <rect x="12" y="-12" width="3" height="12" fill="#555" />
      {/* Símbolo WiFi */}
      <circle cx="0" cy="-8" r="2" fill="#e74c3c" />
      <circle cx="0" cy="-8" r="6" fill="none" stroke="#e74c3c" strokeWidth="1" opacity="0.5" />
    </g>

    {/* Destello sobre la computadora */}
    {flash && <FlashSpark x={130} y={135} onClick={onFlashClick} />}
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
          ⚠ DATOS_INTERCEPTADOS
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
  location: 'Café Amanecer',
  time: '2:45 PM',
  object: 'Objeto: WiFi público del café sin contraseña',
  narrative:
    'Esperas a un cliente en un café. Necesitas terminar un informe con datos de proyectos antes de la reunión que comienza en 10 minutos. El café ofrece WiFi gratis. Tu celular tiene datos pero es plan limitado.',
  choices: [
    {
      label: 'Conectarte al WiFi del café, es lo más rápido',
      level: 'danger',
      risk: 28,
      feedback:
        'Un WiFi público sin contraseña no tiene encriptación. Todos tus datos —emails, contraseñas, archivos— viajan en texto plano. Cualquiera en el café con herramientas básicas puede interceptar tu tráfico.',
    },
    {
      label: 'Sincronizar los cambios en la nube mientras esperas',
      level: 'danger',
      risk: 25,
      feedback:
        'Cuando sincronizas con la nube desde un WiFi público, tu usuario y contraseña viajan sin cifrar. Un atacante puede capturar tus credenciales e infiltrarse en los sistemas de la empresa.',
    },
    {
      label: 'Usar los datos móviles de tu celular',
      level: 'safe',
      risk: 0,
      feedback:
        'Correcto. Tu conexión 4G/5G está cifrada. Es más lento pero seguro. Cuando tienes datos confidenciales, nunca vale la pena usar WiFi público.',
    },
    {
      label: 'Dejar el trabajo para después, en la oficina',
      level: 'warn',
      risk: 5,
      feedback:
        'Seguro, pero retrasa el trabajo. Es la opción más conservadora. Cuando no hay conexión confiable, esperar es lo más prudente.',
    },
  ],
}

function ConexionPublica() {
  const navigate = useNavigate()
  const run = useScenarioRun('fisico/conexion-publica')

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
        outcome: outcomeForLevel(choice.level),
      })
    }, 750)
  }

  const contexto: Contexto = {
    antes: (
      <>
        Los espacios públicos como cafés ofrecen WiFi sin contraseña para atraer clientes. El problema:
        sin encriptación, cualquiera en la red puede ver todo lo que transmites. Trabajar con datos
        confidenciales en una red pública expone esos datos a interceptación.
      </>
    ),
    ahora: (
      <>
        <strong>Tarde</strong> estás en un café esperando una reunión. Necesitas terminar un informe con datos
        de la empresa. El café tiene WiFi gratis ({'"'}CafeAmanecer_Free{'"'}, sin contraseña). Tu celular tiene
        datos pero es plan limitado.
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
            <SceneArt flash={!choicesShown && !revealPending} onFlashClick={handleFlashClick} />
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
                    {verdictForLevel(resolved.level)}
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
          <div className={`${styles.stamp} ${styles[resolved.level]}`}>{stampForLevel(resolved.level)}</div>
        </div>
      )}
    </div>
  )

  const nota = (
    <div className="text-base leading-relaxed text-body">
      <p>Necesitas trabajar con datos de la empresa en un café. ¿Cómo te conectas?</p>
    </div>
  )

  return (
    <EscenarioLayout
      escenarioId="fisico/conexion-publica"
      resumen="WiFi público — ¿la usas o esperas?"
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

export default ConexionPublica
