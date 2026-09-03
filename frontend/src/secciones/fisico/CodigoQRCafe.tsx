import { useState } from 'react'
import EscenarioLayout from '../../components/EscenarioLayout'
import { useFlashTransition } from '../../hooks/useFlashTransition'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import Instrucciones from '../../components/ui/Instrucciones'
import { useScenarioRun } from '../../hooks/useScenarioRun'

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

const SCENARIO: { location: string; time: string; narrative: string; choices: Choice[] } = {
  location: 'Café',
  time: '2:30 PM',
  narrative:
    'Estás en un café con tu laptop. En la pared ves un código QR grande que dice "WiFi GRATIS - Escanea aquí". Tu conexión móvil es lenta.',
  choices: [
    {
      label: 'Escanear el código QR para conectarme al WiFi',
      level: 'danger',
      risk: 10,
      feedback: 'Escanear códigos QR desconocidos es muy riesgoso. El código podría redirigirte a un sitio falso que simule ser el del café pero en realidad robe credenciales o instale malware. Los atacantes usan QR codes porque son difíciles de verificar a simple vista. Siempre es mejor pedir la contraseña del WiFi directamente al personal del café.',
    },
    {
      label: 'Preguntar al personal del café por la contraseña del WiFi',
      level: 'safe',
      risk: 0,
      feedback: 'Excelente decisión. Pedir la contraseña directamente al personal es la forma segura de conectarse. Los cafés legítimos siempre tienen un WiFi con contraseña que pueden darte. Desconfía de cualquier red abierta o códigos QR aleatorios.',
    },
    {
      label: 'Usar datos móviles aunque sea lento',
      level: 'warn',
      risk: 0,
      feedback: 'Buena opción si es posible. Usar datos móviles es más seguro que conectarse a redes WiFi desconocidas, aunque sea más lento. Sin embargo, lo ideal es pedir la contraseña al café.',
    },
  ],
}

function verdictLabel(level: Level): string {
  return {
    safe: '✓ Bien resuelto',
    warn: '◐ A medias',
    danger: '✗ No salió bien',
  }[level]
}

function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export default function CodigoQRCafe() {
  const run = useScenarioRun('fisico/qr-cafe-wifi')
  const stampFlash = useFlashTransition()

  const [resolved, setResolved] = useState<Resolved | null>(null)
  const [revealPending, setRevealPending] = useState(false)
  const [shuffledChoices, setShuffledChoices] = useState<Choice[]>([])

  function onEmpezar() {
    setResolved(null)
    setShuffledChoices(shuffled(SCENARIO.choices))
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
        Los cafés y espacios públicos son lugares donde los atacantes dejan señales falsas. Un
        código QR en la pared podría parecer legítimo pero en realidad redirigirte a un sitio
        malicioso o iniciar una descarga no autorizada. La gente confía más en códigos QR que en
        enlaces porque parecen "más seguros", pero el riesgo es el mismo.
      </>
    ),
    ahora: (
      <>
        <strong>Ahora</strong> necesitas conectarte a internet en un café. Ves un código QR en la
        pared. ¿Qué haces?
      </>
    ),
  }

  const ESCENA = () => (
    <div className="w-full space-y-4 flex flex-col h-full">
      <img
        src="/InternetCafe.jpeg"
        alt="Café - Código QR en la pared"
        className="w-full h-170 object-cover rounded shadow-md"
      />

      <div className="bg-gray-100 border border-gray-300 rounded p-3 text-xs grid grid-cols-3 gap-3">
        <div className="bg-white rounded p-2 border-l-4 border-blue-500">
          <p className="text-gray-600 text-xs font-semibold">Ubicación</p>
          <p className="text-gray-800 font-bold text-sm">{SCENARIO.location}</p>
        </div>
        <div className="bg-white rounded p-2 border-l-4 border-green-500">
          <p className="text-gray-600 text-xs font-semibold">Hora</p>
          <p className="text-gray-800 font-bold text-sm">{SCENARIO.time}</p>
        </div>
        <div className="bg-white rounded p-2 border-l-4 border-orange-500">
          <p className="text-gray-600 text-xs font-semibold">Contexto</p>
          <p className="text-gray-800 font-bold text-sm">WiFi Público</p>
        </div>
      </div>

      {!resolved && shuffledChoices.length > 0 && (
        <div className="space-y-2 mt-4 px-2">
          {shuffledChoices.map((choice) => (
            <button
              key={choice.label}
              onClick={() => handleChoice(choice)}
              disabled={revealPending || resolved !== null}
              className="w-full px-4 py-2 rounded font-semibold text-gray-800 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm text-left"
            >
              {choice.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const pantalla = <ESCENA />

  const decisionPanel = resolved ? (
    <div className="space-y-4">
      <div className="border-l-4 border-gray-400 pl-3 py-1">
        <p className="text-xs font-bold uppercase text-gray-700 mb-2">{verdictLabel(resolved.level)}</p>
        <p className="text-sm text-body leading-relaxed">{resolved.feedback}</p>
      </div>
    </div>
  ) : (
    <Instrucciones
      pista={
        <p>
          Tienes tres caminos posibles: escanear el QR, pedir la contraseña al café, o usar datos móviles.
          Cuál de los tres es el más seguro es justamente lo que decides tú.
        </p>
      }
    >
      <div className="grid gap-3">
        <p className="text-lg font-semibold text-ink">¿Qué haces?</p>
        <p className="text-base leading-relaxed text-body">{SCENARIO.narrative}</p>
      </div>
    </Instrucciones>
  )

  const nota = (
    <div className="text-base leading-relaxed text-body">
      <p>
        Ves un código QR en la pared del café que ofrece WiFi gratis. ¿Es seguro escanearlo?
      </p>
    </div>
  )

  return (
    <EscenarioLayout
      escenarioId="fisico/qr-cafe-wifi"
      resumen="Código QR en café — decide si escanearlo"
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
