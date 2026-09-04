import { useState } from 'react'
import EscenarioLayout from '../../components/EscenarioLayout'
import { useFlashTransition } from '../../hooks/useFlashTransition'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import dossierTheme from '../../styles/dossier-theme.module.css'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import styles from './fisico.module.css'

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


const SCENARIO_PARKING = {
  location: 'Estacionamiento',
  time: '7:52 AM',
  object: 'Objeto: USB negro con etiqueta manuscrita',
  narrative:
    'Llegas temprano. Cerca de tu auto, en el suelo, hay un USB negro con una etiqueta escrita a mano: <em>"NÓMINA DICIEMBRE, CONFIDENCIAL"</em>. No hay nadie cerca para preguntar de quién es.',
  choices: [
    {
      label: 'Agarrarlo, alguien lo dejó y probablemente lo necesita',
      level: 'warn',
      risk: 8,
      feedback: 'Agarrar un USB desconocido es riesgoso. Aunque pueda parecer inocente, los ataques USB están diseñados exactamente para ser encontrados y recogidos. El USB podría ejecutar código automáticamente o simular un teclado para inyectar comandos (ataque HID). La etiqueta "confidencial" es el cebo perfecto.',
    },
    {
      label: 'Dejarlo ahí, no es asunto tuyo',
      level: 'safe',
      risk: 0,
      feedback: 'Correcto. No tocar dispositivos desconocidos es la decisión segura. Aunque alguien lo haya dejado, no debes exponerte a riesgos de seguridad. Lo mejor es reportar el USB encontrado al área de IT para que lo inspeccionen en un entorno controlado.',
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
  const run = useScenarioRun('fisico/trampa-usb')

  const [choicesShown, setChoicesShown] = useState(false)
  const [shuffledChoices, setShuffledChoices] = useState<Choice[]>([])
  const [revealPending, setRevealPending] = useState(false)
  const [resolved, setResolved] = useState<Resolved | null>(null)

  const stampFlash = useFlashTransition()

  const currentScenario = SCENARIO_PARKING

  function onEmpezar() {
    setChoicesShown(false)
    setShuffledChoices([])
    setRevealPending(false)
    setResolved(null)
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
        En tu oficina, los espacios comunes (estacionamiento, salas de descanso, escritorios, recepción)
        tienen varios puntos donde alguien podría dejar un dispositivo: un USB en el escritorio, un cable
        en un tomacorriente, un dispositivo de carga en la sala de descanso. Sabes que los ataques USB
        son comunes pero raramente los ves venir porque generalmente parecen inofensivos: están etiquetados
        de forma atractiva (nómina, bonificación) o promocional (regalo de la empresa).
      </>
    ),
    ahora: (
      <>
        <strong>Hoy temprano</strong> llegas al estacionamiento y encuentras un USB negro en el suelo
        cerca de tu auto. ¿Qué haces?
      </>
    ),
  }

  const ESCENA = () => (
    <div className="w-full space-y-4 flex flex-col h-full">
      {/* Imagen GRANDE ocupando todo el ancho */}
      <img
        src="/USBEstacionamiento.jpeg"
        alt="Estacionamiento - USB Abandonado"
        className="w-full h-170 object-cover rounded shadow-md"
      />

      {/* Panel de información compacto debajo */}
      <div className="bg-gray-100 border border-gray-300 rounded p-3 text-xs grid grid-cols-3 gap-3">
        <div className="bg-white rounded p-2 border-l-4 border-blue-500">
          <p className="text-gray-600 text-xs font-semibold">Ubicación</p>
          <p className="text-gray-800 font-bold text-sm">{currentScenario.location}</p>
        </div>

        <div className="bg-white rounded p-2 border-l-4 border-orange-500">
          <p className="text-gray-600 text-xs font-semibold">Hora</p>
          <p className="text-gray-800 font-bold text-sm">{currentScenario.time}</p>
        </div>

        <div className="bg-white rounded p-2 border-l-4 border-red-500">
          <p className="text-gray-600 text-xs font-semibold">Objeto</p>
          <p className="text-gray-800 font-bold text-sm">USB Desconocido</p>
        </div>
      </div>

      {/* Opciones de acción - mostrar primero opciones de agarrar/dejar */}
      {shuffledChoices.length === 0 ? (
        <div className="flex gap-2 -mt-4">
          <button
            onClick={() => handleChoice(SCENARIO_PARKING.choices[0]! as Choice)}
            disabled={revealPending || resolved !== null}
            className="flex-1 px-3 py-3 rounded font-semibold text-gray-800 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
          >
            Agarrarlo, alguien lo dejó
          </button>
          <button
            onClick={() => handleChoice(SCENARIO_PARKING.choices[1]! as Choice)}
            disabled={revealPending || resolved !== null}
            className="flex-1 px-3 py-3 rounded font-semibold text-gray-800 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
          >
            Dejarlo ahí
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          {shuffledChoices.map((choice) => (
            <button
              key={choice.label}
              onClick={() => handleChoice(choice)}
              disabled={revealPending || resolved !== null}
              className="flex-1 px-3 py-3 rounded font-semibold text-gray-800 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
            >
              {choice.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const decisionPanel = resolved ? (
    <div className="space-y-4">
      <div className="border-l-4 border-gray-400 pl-3 py-1">
        <p className="text-xs font-bold uppercase text-gray-700 mb-2">{verdictLabel(resolved.level)}</p>
        <p className="text-sm text-body leading-relaxed">{resolved.feedback}</p>
      </div>
    </div>
  ) : (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-ink mb-3">¿Qué haces?</h3>
        <p className="text-sm text-body leading-relaxed">{currentScenario.narrative.replace(/<[^>]*>/g, '')}</p>
      </div>
      <button
        onClick={() => {
          setShuffledChoices(shuffled(currentScenario.choices as Choice[]))
          setChoicesShown(true)
        }}
        className="text-sm font-medium text-link underline decoration-dotted"
      >
        No sé por dónde empezar
      </button>
      {choicesShown && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-body">
          Haz click en el USB en la imagen o selecciona una opción arriba.
        </div>
      )}
      <details className="text-sm leading-relaxed text-body">
        <summary className="cursor-pointer list-none font-medium text-link underline decoration-dotted underline-offset-4">
          ¿Cuándo termina el escenario?
        </summary>
        <p className="mt-2">
          Cuando decidas qué hacer con el USB: agarrarlo o dejarlo donde está. No hay vuelta atrás
          una vez elijas.
        </p>
      </details>
    </div>
  )

  const pantalla = (
    <div className={`${dossierTheme.dossierTheme} ${styles.app}`}>
      <style>{`
        [role="status"] { display: none !important; }
        [role="alert"] { display: none !important; }
      `}</style>
      <main className={styles.mainArea} style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
        <div className={styles.sceneView} style={{ gridColumn: '1', gridRow: '4', height: '100%', flex: 1 }}>
          <div className={styles.sceneCanvas} style={{ overflow: 'visible', display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
            <ESCENA />
          </div>
        </div>
      </main>


      {revealPending && resolved && (
        <div className={`${styles.stampOverlay} ${stampFlash.active ? styles.show : ''}`}>
          <div className={`${styles.stamp} ${styles[resolved.level]}`}>{stampWord(resolved.level)}</div>
        </div>
      )}
    </div>
  )

  const nota = (
    <div className="text-base leading-relaxed text-body">
      <p>Encuentras un USB abandonado en el estacionamiento. ¿Lo agarras o lo dejas?</p>
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
      decision={decisionPanel}
      ocultarDecision={false}
      resultado={resolved ? (resolved.level === 'safe' ? 'good' : resolved.level === 'warn' ? 'partial' : 'bad') : undefined}
      onEmpezar={onEmpezar}
      dispositivo="escritorio"
    />
  )
}

export default TrampaUSB
