import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import EscenarioLayout from '../../components/EscenarioLayout'
import FlashOverlay from '../../components/ui/FlashOverlay'
import Instrucciones from '../../components/ui/Instrucciones'
import { useFlashTransition } from '../../hooks/useFlashTransition'
import { useSiguienteEscenario } from '../../hooks/useSiguienteEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import dossierTheme from '../../styles/dossier-theme.module.css'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import styles from './fisico.module.css'

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

const SCENE_ART_SCENARIO = () => (
  <img
    src="/EscaneoBilletera.jpeg"
    alt="Calle - Un distractor te habla mientras alguien escanea tu billetera"
    className="w-full h-170 object-cover rounded shadow-md"
  />
)

const SCENE_ART_DISCOVERY = ({ flash, onFlashClick }: { flash: boolean; onFlashClick: () => void }) => {
  const [phoneRinging, setPhoneRinging] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setPhoneRinging(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative w-full">
      <img
        src="/LlamadaBanco.jpeg"
        alt="Escritorio - Llamada entrante del banco"
        className="w-full h-170 object-cover rounded shadow-md"
      />
      {phoneRinging && (
        <p className="absolute inset-x-0 bottom-2 text-center text-sm font-bold text-red-600">
          ¡Llamada del banco!
        </p>
      )}
      {flash && phoneRinging && (
        <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
          <FlashSpark x={195} y={110} onClick={onFlashClick} />
        </svg>
      )}
    </div>
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

function TarjetaClonada() {
  const navigate = useNavigate()
  const run = useScenarioRun('fisico/tarjeta-clonada')
  const { ruta: siguienteRuta } = useSiguienteEscenario('fisico/tarjeta-clonada')

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
    if (siguienteRuta) navigate(siguienteRuta)
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
      setShuffledChoices(shuffled(SCENARIO_DISCOVERY.choices as Choice[]))
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
        outcome: choice.level === 'safe' ? 'CORRECTO' : choice.level === 'warn' ? 'PARCIAL' : 'INCORRECTO',
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
              <SCENE_ART_SCENARIO />
            ) : (
              <SCENE_ART_DISCOVERY flash={!choicesShown && !revealPending} onFlashClick={handleFlashClick} />
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
                    {verdictLabel(resolved.level)}
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
          <div className={`${styles.stamp} ${styles[resolved.level]}`}>{stampWord(resolved.level)}</div>
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

  const decisionPanel = resolved ? null : (
    <Instrucciones
      queHaces={
        <p className="text-base leading-relaxed text-body">
          {phase === 'scenario'
            ? 'Observa la escena. En unos segundos pasarás automáticamente a la siguiente fase.'
            : 'Toca el destello ⚡ sobre el teléfono para responder a la llamada del banco.'}
        </p>
      }
      cuandoTermina={
        <>
          Cuando el banco te llame y elijas una de las cuatro opciones frente a la notificación de
          fraude. La fase inicial es solo observación y no cuenta como decisión.
        </>
      }
      pista={
        phase === 'scenario' ? (
          <p>En esta fase solo observas: no hay nada que decidir todavía.</p>
        ) : (
          <p>
            Tienes cuatro caminos posibles: bloquear y denunciar, ignorar la notificación, bloquear
            sin reportar, o cambiar de banco. Cuál de ellos es el más completo es lo que decides tú.
          </p>
        )
      }
    />
  )

  return (
    <EscenarioLayout
      escenarioId="fisico/tarjeta-clonada"
      resumen="Billetera clonada — ¿dónde la guardas y cómo respondes?"
      contexto={contexto}
      nota={nota}
      identidad={[]}
      pantalla={pantalla}
      decision={decisionPanel}
      ocultarDecision={false}
      onEmpezar={onEmpezar}
      dispositivo="escritorio"
    />
  )
}

export default TarjetaClonada
