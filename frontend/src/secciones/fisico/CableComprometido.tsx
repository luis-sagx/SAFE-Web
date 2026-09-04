import { useState } from 'react'
import { useNavigate } from 'react-router'
import EscenarioLayout from '../../components/EscenarioLayout'
import FlashOverlay from '../../components/ui/FlashOverlay'
import { useFlashTransition } from '../../hooks/useFlashTransition'
import { useSiguienteEscenario } from '../../hooks/useSiguienteEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import dossierTheme from '../../styles/dossier-theme.module.css'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import styles from './fisico.module.css'

type Level = 'safe' | 'warn' | 'danger'
type Phase = 'break-room' | 'office' | 'resolved'

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

const SCENE_ART_BREAK_ROOM = ({ flash, onFlashClick }: { flash: boolean; onFlashClick: () => void }) => (
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

    {/* Cable en el escritorio */}
    <path d="M240 130 Q250 120 260 130 Q270 140 260 150" stroke="#2b2318" strokeWidth="4" fill="none" />
    <circle cx="265" cy="145" r="6" fill="#c0c0c0" />

    {flash && <FlashSpark x={250} y={130} onClick={onFlashClick} />}
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
          ⚠ ACCESO_BLOQUEADO
        </text>
        <text x="200" y="128" textAnchor="middle" fontFamily="'IBM Plex Mono',monospace" fontSize="10" fill="#e8b9b3">
          credenciales comprometidas...
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

const SCENARIO_BREAK_ROOM = {
  location: 'Sala de descanso',
  time: '10:15 AM',
  object: 'Objeto: cable USB conectado al tomacorriente',
  narrative:
    'Vas a cargar tu celular y notas un cable USB ya conectado al enchufe público, sin nadie cerca reclamándolo. Se ve nuevo y en buen estado.',
  choices: [
    {
      label: 'Usarlo para cargar tu celular aquí',
      level: 'danger',
      risk: 15,
      feedback:
        "Un cable desconocido en un punto de carga público puede llevar un chip malicioso (juice jacking). Conectarlo directamente a tu dispositivo es un riesgo inmediato.",
    },
    {
      label: 'Llevártelo a tu escritorio, ahí lo necesitas más',
      level: 'warn',
      risk: 8,
      feedback: '',
    },
  ],
}

const SCENARIO_OFFICE = {
  location: 'Tu escritorio',
  time: '10:30 AM',
  object: 'Objeto: cable USB desconocido que encontraste',
  narrative: 'El cable está en tu escritorio. Ahora tienes que decidir qué hacer con él.',
  choices: [
    {
      label: 'Conectarlo a tu celular para cargar',
      level: 'danger',
      risk: 28,
      feedback:
        "Un cable 'olvidado' puede llevar un chip que roba datos o inyecta comandos apenas se conecta un dispositivo (juice jacking). Regla simple: solo tu propio cable.",
    },
    {
      label: 'Conectarlo a tu computadora para "revisar" qué es',
      level: 'danger',
      risk: 30,
      feedback:
        "Existen cables modificados (tipo 'O.MG Cable') con un chip que puede inyectar comandos o robar datos. Conectarlo a tu computadora es incluso más peligroso que al celular.",
    },
    {
      label: 'Entregarlo a IT para análisis',
      level: 'safe',
      risk: 0,
      feedback:
        'Correcto. Cualquier accesorio no identificado debe analizarse en un entorno controlado, nunca usarse directamente.',
    },
    {
      label: 'Descartarlo directamente',
      level: 'safe',
      risk: 0,
      feedback:
        'También correcto. Descartar un cable desconocido es la forma más segura de evitar cualquier riesgo de juice jacking o inyección de comandos.',
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

function CableComprometido() {
  const navigate = useNavigate()
  const run = useScenarioRun('fisico/cable-comprometido')
  const { ruta: siguienteRuta } = useSiguienteEscenario('fisico/cable-comprometido')

  const [phase, setPhase] = useState<Phase>('break-room')
  const [choicesShown, setChoicesShown] = useState(false)
  const [shuffledChoices, setShuffledChoices] = useState<Choice[]>([])
  const [revealPending, setRevealPending] = useState(false)
  const [resolved, setResolved] = useState<Resolved | null>(null)

  const flash = useFlashTransition()
  const stampFlash = useFlashTransition()

  const showFeedback = !!resolved && !revealPending
  const currentScenario = phase === 'break-room' ? SCENARIO_BREAK_ROOM : SCENARIO_OFFICE

  function onEmpezar() {
    setPhase('break-room')
    setChoicesShown(false)
    setShuffledChoices([])
    setRevealPending(false)
    setResolved(null)
  }

  function handleNext() {
    if (siguienteRuta) navigate(siguienteRuta)
  }

  function handleFlashClick() {
    setShuffledChoices(shuffled(currentScenario.choices as Choice[]))
    setChoicesShown(true)
  }

  function handleChoice(choice: Choice) {
    setRevealPending(true)
    run.recordDecision({ nivel: choice.level, riesgo: choice.risk })

    stampFlash.trigger(() => {
      if (phase === 'break-room') {
        if (choice.label.includes('Llevártelo')) {
          setRevealPending(false)
          setChoicesShown(false)
          setShuffledChoices([])
          setPhase('office')
        } else {
          setRevealPending(false)
          setResolved({ level: choice.level, feedback: choice.feedback })
          void run.finish({
            endingId: choice.level,
            outcome: choice.level === 'safe' ? 'CORRECTO' : choice.level === 'warn' ? 'PARCIAL' : 'INCORRECTO',
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
        Los espacios comunes en la oficina tienen puntos de carga compartidos. Aunque sean accesibles
        para todos, representan un riesgo: alguien podría haber dejado un cable o dispositivo modificado
        para interceptar datos o inyectar código cuando lo conectes.
      </>
    ),
    ahora:
      phase === 'break-room' ? (
        <>
          <strong>Hoy a media mañana</strong> vas a cargar tu celular en la sala de descanso y encuentras
          un cable USB ya conectado al tomacorriente público. ¿Qué haces?
        </>
      ) : (
        <>
          <strong>En tu escritorio</strong> tienes el cable desconocido. Ahora tienes que decidir qué hacer
          con él.
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
            ) : phase === 'break-room' ? (
              <SCENE_ART_BREAK_ROOM flash={!choicesShown && !revealPending} onFlashClick={handleFlashClick} />
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
        {phase === 'break-room'
          ? 'Encuentras un cable USB en un punto de carga compartido. ¿Lo usas o lo reportas?'
          : 'Ya tienes el cable en tu escritorio. ¿Qué haces con él?'}
      </p>
    </div>
  )

  return (
    <EscenarioLayout
      escenarioId="fisico/cable-comprometido"
      resumen="Cable sospechoso — ¿lo usas o lo reportas?"
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

export default CableComprometido
