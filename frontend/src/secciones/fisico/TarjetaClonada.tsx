import { useState, useEffect } from 'react'
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

const animationCSS = `
  @keyframes personApproaches {
    0% { transform: translateX(-100px); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }
  @keyframes personLeavesQuietly {
    0% { transform: translateX(0); opacity: 1; }
    100% { transform: translateX(100px); opacity: 0; }
  }
  @keyframes scanCard {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
  .person-approaching {
    animation: personApproaches 2s ease-in-out forwards;
  }
  .person-leaving {
    animation: personLeavesQuietly 2s ease-in-out forwards;
  }
  .scan-effect {
    animation: scanCard 1.5s ease-in-out infinite;
  }
`

type Level = 'safe' | 'warn' | 'danger'
type Phase = 'scenario' | 'discovery' | 'resolved'

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

interface ScenePhase {
  distractor: number
  attacker: number
  cloning: boolean
}

const SceneArtScenario = () => {
  const [phase, setPhase] = useState<ScenePhase>({
    distractor: -100,
    attacker: 420,
    cloning: false,
  })

  useEffect(() => {
    const timeline = [
      { delay: 600, update: { distractor: 90 } },
      { delay: 2000, update: { attacker: 260 } },
      { delay: 3000, update: { cloning: true } },
      { delay: 4500, update: { attacker: 450 } },
    ]

    timeline.forEach(({ delay, update }) => {
      setTimeout(() => {
        setPhase((prev) => ({ ...prev, ...update }))
      }, delay)
    })
  }, [])

  return (
    <>
      <style>{animationCSS}</style>
      <svg viewBox="0 0 400 220">
        {/* Fondo calle/café */}
        <rect width="400" height="220" fill="#e8dcc8" />
        <rect y="160" width="400" height="60" fill="#c9b896" />

        {/* Tú (víctima en el centro) */}
        <circle cx="200" cy="100" r="15" fill="#d4a574" />
        <rect x="185" y="115" width="30" height="40" fill="#2a5a9a" rx="2" />
        <rect x="170" y="120" width="15" height="8" fill="#d4a574" rx="4" />
        <rect x="215" y="120" width="15" height="8" fill="#d4a574" rx="4" />
        <rect x="190" y="155" width="8" height="25" fill="#3a3a3a" />
        <rect x="202" y="155" width="8" height="25" fill="#3a3a3a" />

        {/* Tu billetera/tarjeta visible */}
        <rect x="220" y="120" width="22" height="14" fill="#cc0000" rx="2" />
        <text x="231" y="130" textAnchor="middle" fontSize="7" fill="#fff" fontWeight="bold">
          VISA
        </text>

        {/* Persona 1 - Distractor (acercándose desde la izquierda) */}
        <g transform={`translate(${phase.distractor}, 0)`}>
          <circle cx="80" cy="70" r="15" fill="#d4a574" />
          <rect x="65" y="85" width="30" height="40" fill="#4a6b8a" rx="2" />
          <rect x="50" y="90" width="15" height="8" fill="#d4a574" rx="4" />
          <rect x="95" y="90" width="15" height="8" fill="#d4a574" rx="4" />
          <rect x="70" y="125" width="8" height="25" fill="#3a3a3a" />
          <rect x="82" y="125" width="8" height="25" fill="#3a3a3a" />
          {/* Burbuja de conversación */}
          {phase.distractor > -50 && (
            <text x="80" y="50" textAnchor="middle" fontSize="10" fill="#333">
              ¿Qué hora es?
            </text>
          )}
        </g>

        {/* Persona 2 - Attacker (acercándose desde la derecha atrás) */}
        {phase.attacker < 400 && (
          <g transform={`translate(${phase.attacker - 280}, 20)`}>
            <circle cx="280" cy="60" r="12" fill="#8a6a4a" />
            <rect x="270" y="72" width="20" height="35" fill="#3a3a3a" rx="2" />
            <rect x="260" y="78" width="8" height="5" fill="#8a6a4a" rx="1" />
            <rect x="292" y="78" width="8" height="5" fill="#8a6a4a" rx="1" />

            {/* Dispositivo de clonación en la mano del atacante */}
            {phase.attacker < 300 && (
              <g>
                <rect x="285" y="85" width="16" height="10" fill="#1a1a1a" rx="2" />
                <circle
                  cx="293"
                  cy="90"
                  r="2.5"
                  fill="#ff6b6b"
                  className={phase.cloning ? 'scan-effect' : ''}
                />
              </g>
            )}
          </g>
        )}

        {/* Líneas de escaneo/clonación */}
        {phase.cloning && phase.attacker < 320 && (
          <g opacity="0.7">
            <path d="M210 120 Q240 115 260 120" stroke="#ff6b6b" strokeWidth="1.5" fill="none" strokeDasharray="3" />
            <path d="M210 130 Q240 125 260 130" stroke="#ff6b6b" strokeWidth="1.5" fill="none" strokeDasharray="3" />
          </g>
        )}

        {/* No hay interacción en fase 1, es automática */}
      </svg>
    </>
  )
}

const SceneArtDiscovery = ({ flash, onFlashClick }: { flash: boolean; onFlashClick: () => void }) => {
  const [phoneRinging, setPhoneRinging] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setPhoneRinging(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <svg viewBox="0 0 400 220">
      {/* Fondo oficina */}
      <rect width="400" height="220" fill="#f0ebe3" />
      <rect y="160" width="400" height="60" fill="#b8a896" />

      {/* Escritorio */}
      <rect x="60" y="110" width="280" height="50" fill="#8a7a6a" stroke="#6a5a4a" strokeWidth="2" />
      <rect x="80" y="85" width="240" height="28" fill="#d4cfc8" />

      {/* Tú en el escritorio */}
      <circle cx="200" cy="60" r="14" fill="#d4a574" />
      <rect x="186" y="74" width="28" height="35" fill="#4a7aaa" rx="2" />
      <rect x="170" y="79" width="12" height="7" fill="#d4a574" rx="2" />
      <rect x="218" y="79" width="12" height="7" fill="#d4a574" rx="2" />

      {/* Computadora en el escritorio */}
      <g transform="translate(80, 100)">
        <rect x="0" y="0" width="50" height="35" fill="#1a1a1a" stroke="#333" strokeWidth="1" rx="2" />
        <rect x="1" y="1" width="48" height="33" fill="#0a0a2a" />
      </g>

      {/* Teléfono rojo (sonando) */}
      <g transform={`translate(250, 115) ${phoneRinging ? 'scale(1.1)' : 'scale(1)'}`}>
        <ellipse cx="0" cy="0" rx="12" ry="10" fill="#cc0000" />
        <circle cx="-5" cy="-3" r="2" fill="#fff" />
        <circle cx="5" cy="-3" r="2" fill="#fff" />
      </g>

      {/* Líneas de sonido si está sonando */}
      {phoneRinging && (
        <g opacity="0.6">
          <circle cx="250" cy="115" r="20" fill="none" stroke="#ff6b6b" strokeWidth="1" />
          <circle cx="250" cy="115" r="28" fill="none" stroke="#ff6b6b" strokeWidth="1" opacity="0.4" />
        </g>
      )}

      {/* Texto de alerta */}
      {phoneRinging && (
        <text x="200" y="180" textAnchor="middle" fontSize="12" fill="#cc0000" fontWeight="bold">
          ¡Llamada del banco!
        </text>
      )}

      {flash && phoneRinging && <FlashSpark x={200} y={140} onClick={onFlashClick} />}
    </svg>
  )
}

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
          ⚠ DATOS_COMPROMETIDOS
        </text>
        <text x="200" y="128" textAnchor="middle" fontFamily="'IBM Plex Mono',monospace" fontSize="10" fill="#e8b9b3">
          tarjeta clonada sin bloquear...
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

const SCENARIO_INITIAL = {
  location: 'Calle/Restaurante',
  time: '3:45 PM',
  object: 'Lo que acabas de ver',
  narrative:
    'Tu billetera fue clonada sin que lo notaras. Esto sucede constantemente en lugares concurridos cuando guardas tu tarjeta en lugares accesibles.',
}

const SCENARIO_DISCOVERY = {
  location: 'Banco',
  time: '4 días después',
  object: 'Objeto: Notificación de transacciones fraudulentas',
  narrative:
    'El banco te llama. Hay transacciones fraudulentas en tu tarjeta por $2,500. Tu tarjeta fue clonada hace 4 días. ¿Qué haces ahora?',
  choices: [
    {
      label: 'Bloquear la tarjeta inmediatamente y denunciar el fraude',
      level: 'safe',
      risk: 0,
      feedback:
        'Correcto. Esto detiene futuras transacciones y protege el resto de tu dinero. El banco te devuelve el monto fraudulento en 3-7 días.',
    },
    {
      label: 'Ignorar la notificación y esperar a ver si hay más fraude',
      level: 'danger',
      risk: 40,
      feedback:
        'Muy riesgoso. Cada día que esperes, el atacante puede hacer más compras. El monto fraudulento crecerá exponencialmente.',
    },
    {
      label: 'Bloquear la tarjeta pero no reportar nada, es problema del banco',
      level: 'warn',
      risk: 15,
      feedback:
        'Parcialmente correcto: bloqueando evitas más daño, pero no reportar significa que el atacante sigue libre para clonar otras tarjetas.',
    },
    {
      label: 'Cambiar de banco y abrir una nueva cuenta',
      level: 'warn',
      risk: 12,
      feedback:
        'No es malo, pero innecesario. Simplemente bloquea la tarjeta y el banco te emite una nueva. Cambiar de banco no previene futuros clonajes si no proteges tu billetera.',
    },
  ],
}

function TarjetaClonada() {
  const navigate = useNavigate()
  const run = useScenarioRun('fisico/tarjeta-clonada')

  const [phase, setPhase] = useState<Phase>('scenario')
  const [choicesShown, setChoicesShown] = useState(false)
  const [shuffledChoices, setShuffledChoices] = useState<Choice[]>([])
  const [revealPending, setRevealPending] = useState(false)
  const [resolved, setResolved] = useState<Resolved | null>(null)

  const flash = useFlashTransition()
  const stampFlash = useFlashTransition()

  const showFeedback = !!resolved && !revealPending
  const currentScenario = phase === 'scenario' ? SCENARIO_INITIAL : SCENARIO_DISCOVERY

  function onEmpezar() {
    setPhase('scenario')
    setChoicesShown(false)
    setShuffledChoices([])
    setRevealPending(false)
    setResolved(null)
  }

  function handleNext() {
    navigate('/seccion/fisico')
  }

  useEffect(() => {
    if (phase === 'scenario' && !choicesShown) {
      const timer = setTimeout(() => {
        setPhase('discovery')
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [phase, choicesShown])

  function handleFlashClick() {
    if (phase === 'discovery' && !choicesShown) {
      setShuffledChoices(shuffle(SCENARIO_DISCOVERY.choices as Choice[]))
      setChoicesShown(true)
    }
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
        En lugares públicos concurridos, los clonadores de tarjetas trabajan en equipo. Mientras uno te distrae con
        una conversación casual, otro escanea tu tarjeta o accede a tu billetera sin que lo notes. El riesgo es
        mayor cuando guardas la tarjeta en lugares accesibles.
      </>
    ),
    ahora:
      phase === 'scenario' ? (
        <>
          <strong>Hoy en la calle</strong> alguien se acerca para hacer pequeña charla: "¿Qué hora es?" o "¿Sabes
          dónde queda tal lugar?". Mientras habla, sientes que pasa gente cerca, pero no le das importancia. Termina la
          conversación y se va.
        </>
      ) : (
        <>
          <strong>4 días después</strong> tu banco te llama: hay transacciones fraudulentas en tu tarjeta. Fue clonada
          hace unos días. ¿Qué haces ahora?
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
            ) : phase === 'scenario' ? (
              <SceneArtScenario />
            ) : (
              <SceneArtDiscovery flash={!choicesShown && !revealPending} onFlashClick={handleFlashClick} />
            )}
          </div>

          <p className={styles.sceneNarrative} dangerouslySetInnerHTML={{ __html: currentScenario.narrative }} />

          {!showFeedback && !choicesShown && !revealPending && (
            <span className={styles.flashHint}>
              {phase === 'scenario' ? 'Observa la escena...' : 'Toca el destello para responder'}
            </span>
          )}

          {showFeedback ? (
            <>
              <p className={styles.sceneObject}>{currentScenario.object}</p>
              <div className={styles.feedbackPanel}>
                <div className={styles.verdictRow}>
                  <span className={`${styles.badge} ${styles[resolved.level]}`}>
                    {verdictForLevel(resolved.level)}
                  </span>
                </div>
                <p className={styles.feedbackText}>{resolved.feedback}</p>

                <div className="mt-6 space-y-4 border-t border-border pt-4">
                  <div>
                    <h4 className="font-semibold text-heading mb-3">Dónde guardar tu billetera</h4>

                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-danger mb-2">Lo que NO deberías hacer:</p>
                        <ul className="space-y-1 text-sm text-body">
                          <li>- Bolsillo trasero de pantalones: lugar favorito de clonadores</li>
                          <li>- Mochila en el suelo: fácil de abrir o cortar</li>
                          <li>- Bolsillo lateral: acceso rápido en aglomeraciones</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-medium text-primary mb-2">Lo que DEBERÍAS hacer:</p>
                        <ul className="space-y-1 text-sm text-body">
                          <li>- Bolsillo delantero de la camisa: visible y difícil de acceder</li>
                          <li>- Billetera anti-clonación RFID/NFC: protege contra escaneos</li>
                          <li>- Bolsillo interior de chaqueta: más seguro que externos</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <button type="button" className={styles.nextBtn} onClick={handleNext}>
                  Siguiente
                </button>
              </div>
            </>
          ) : (
            choicesShown && phase === 'discovery' && (
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
          <div className={`${styles.stamp} ${styles[resolved.level]}`}>{stampForLevel(resolved.level)}</div>
        </div>
      )}
    </div>
  )

  const nota = (
    <div className="text-base leading-relaxed text-body">
      <p>
        {phase === 'scenario'
          ? 'Dónde guardas tu billetera es crítico. Los clonadores usan técnicas de distracción para acceder a tus tarjetas.'
          : 'Cuando tu tarjeta es clonada, la velocidad de reacción es esencial para limitar el daño.'}
      </p>
    </div>
  )

  return (
    <EscenarioLayout
      escenarioId="fisico/tarjeta-clonada"
      resumen="Billetera clonada — ¿dónde la guardas y cómo respondes?"
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

export default TarjetaClonada
