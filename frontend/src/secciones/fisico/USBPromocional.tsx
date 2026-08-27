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
    {/* Fondo pared */}
    <rect width="400" height="180" fill="#d4cfc8" />
    {/* Piso */}
    <rect y="180" width="400" height="40" fill="#9a8f86" />

    {/* Escritorio - tablero */}
    <rect x="30" y="140" width="340" height="50" fill="#8a7a6a" stroke="#6a5a4a" strokeWidth="2" />

    {/* Soporte/patas del escritorio */}
    <rect x="50" y="190" width="15" height="30" fill="#5a4a3a" />
    <rect x="335" y="190" width="15" height="30" fill="#5a4a3a" />

    {/* Computadora/Laptop */}
    <g transform="translate(80, 100)">
      {/* Pantalla */}
      <rect x="0" y="0" width="80" height="50" fill="#1a1a1a" stroke="#333" strokeWidth="1.5" rx="2" />
      <rect x="2" y="2" width="76" height="46" fill="#0a0a2a" />
      {/* Líneas de contenido en pantalla */}
      <line x1="5" y1="10" x2="75" y2="10" stroke="#00ff00" strokeWidth="0.5" />
      <line x1="5" y1="15" x2="75" y2="15" stroke="#00ff00" strokeWidth="0.5" />
      <line x1="5" y1="20" x2="70" y2="20" stroke="#00ff00" strokeWidth="0.5" />
      {/* Base */}
      <rect x="25" y="50" width="30" height="8" fill="#333" />
    </g>

    {/* Papeles random en el escritorio */}
    <g transform="translate(200, 150)">
      {/* Papel 1 */}
      <rect x="-30" y="-15" width="40" height="25" fill="#f5f5f5" stroke="#ccc" strokeWidth="1" transform="rotate(-12)" />
      <line x1="-25" y1="-10" x2="5" y2="-10" stroke="#ddd" strokeWidth="1" />
      <line x1="-25" y1="-5" x2="5" y2="-5" stroke="#ddd" strokeWidth="1" />
      {/* Papel 2 */}
      <rect x="20" y="-10" width="35" height="20" fill="#fffacd" stroke="#daa" strokeWidth="1" transform="rotate(8)" />
      <circle cx="28" cy="0" r="2" fill="#ff9900" />
      {/* Papel 3 */}
      <rect x="-5" y="15" width="30" height="20" fill="#fff" stroke="#bbb" strokeWidth="1" />
      <line x1="0" y1="20" x2="20" y2="20" stroke="#ddd" strokeWidth="0.5" />
    </g>

    {/* USB Promocional - prominente en el escritorio */}
    <g transform="translate(280, 130)" onClick={onFlashClick} style={{ cursor: 'pointer' }}>
      {/* Cuerpo USB - naranja brillante */}
      <rect x="-18" y="0" width="36" height="24" fill="#ff6b35" stroke="#cc5500" strokeWidth="2" rx="4" />

      {/* Logo/texto area - dorado */}
      <rect x="-14" y="3" width="28" height="10" fill="#ffd700" stroke="#daa" strokeWidth="0.5" rx="2" />

      {/* Texto del logo */}
      <text x="0" y="10" textAnchor="middle" fontFamily="Arial" fontSize="6" fontWeight="bold" fill="#cc5500">
        TECH FAIR
      </text>
      <text x="0" y="18" textAnchor="middle" fontFamily="Arial" fontSize="4" fill="#cc5500">
        2024
      </text>

      {/* Conector */}
      <rect x="-5" y="22" width="10" height="6" fill="#c0c0c0" stroke="#888" strokeWidth="0.5" />

      {/* Destello de luz */}
      <circle cx="-8" cy="8" r="2" fill="#fff" opacity="0.6" />
    </g>

    {flash && <FlashSpark x={280} y={120} onClick={onFlashClick} />}
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
          ⚠ MALWARE_DETECTADO
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
        'Los USBs promocionales de eventos son un vector clásico: se regalan o "olvidan" dispositivos infectados con la marca de una feria para bajar la guardia. Que tenga un logo conocido no lo hace confiable.',
    },
    {
      label: 'Guardarlo para revisarlo luego en tu computador personal',
      level: 'warn',
      risk: 15,
      feedback:
        'Esto solo traslada el riesgo a tu equipo personal y no resuelve el origen del dispositivo. El problema no es dónde lo conectas, sino que lo conectas sin verificar.',
    },
    {
      label: 'Preguntar en IT si alguien dejó ese material',
      level: 'safe',
      risk: 0,
      feedback: 'Correcto. Verificar el origen por un canal interno confiable antes de conectar cualquier dispositivo es la respuesta adecuada.',
    },
    {
      label: 'Conectarlo porque venía en el material oficial del evento',
      level: 'danger',
      risk: 26,
      feedback:
        'Que algo lleve el logo de la feria o de una empresa conocida no garantiza nada: los atacantes imitan el material de marca para que bajes la guardia. El origen aparente no reemplaza la verificación.',
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

function USBPromocional() {
  const navigate = useNavigate()
  const run = useScenarioRun('fisico/usb-promocional')

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
        Los dispositivos promocionales de eventos tecnológicos son comunes: USBs, cargadores, adaptadores con logos
        de empresas. Parecen legítimos porque vienen de ferias reales, pero son un vector de ataque perfecto porque
        bajas la guardia cuando ves el logo de una empresa conocida.
      </>
    ),
    ahora: (
      <>
        <strong>Después de almuerzo</strong> encuentras un USB promocional con logo de una feria tecnológica que
        asistió tu empresa hace poco. Está sobre tu teclado, pero no recuerdas haberlo pedido ni quién lo dejó.
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
      <p>Encuentras un USB promocional de una feria tecnológica. ¿Qué haces con él?</p>
    </div>
  )

  return (
    <EscenarioLayout
      escenarioId="fisico/usb-promocional"
      resumen="USB de feria — ¿lo conectas?"
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

export default USBPromocional
