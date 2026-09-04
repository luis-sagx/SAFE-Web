import { useState } from 'react'
import EscenarioLayout from '../../components/EscenarioLayout'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import dossierTheme from '../../styles/dossier-theme.module.css'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import styles from './Baiting.module.css'

type Level = 'safe' | 'danger' | 'partial'

function outcomeForLevel(level: Level): 'CORRECTO' | 'PARCIAL' | 'INCORRECTO' {
  switch (level) {
    case 'safe': return 'CORRECTO'
    case 'partial': return 'PARCIAL'
    case 'danger': return 'INCORRECTO'
  }
}

function resultVariant(level: Level): 'good' | 'partial' | 'bad' {
  switch (level) {
    case 'safe': return 'good'
    case 'partial': return 'partial'
    case 'danger': return 'bad'
  }
}

interface Resolved {
  level: Level
  feedback: string
  details: string
}

function PuertosFriosColdAisle() {
  const run = useScenarioRun('fisico/puertos-frios-datacenter')

  const [resolved, setResolved] = useState<Resolved | null>(null)
  const [mostrarPista, setMostrarPista] = useState(false)

  function handleDecision(decision: 'cierra-reporta' | 'solo-cierra' | 'nada') {
    let result: Resolved

    if (decision === 'cierra-reporta') {
      result = {
        level: 'safe',
        feedback: 'Decisión excelente',
        details:
          'Cerraste la puerta inmediatamente para contener el problema térmico, y luego reportaste al equipo de infraestructura. Esta es la respuesta correcta en emergencias de refrigeración: acción rápida + comunicación. Los sistemas se recuperaron sin pérdida de datos.',
      }
      run.recordDecision({ nivel: 'safe', riesgo: 0 })
    } else if (decision === 'solo-cierra') {
      result = {
        level: 'partial',
        feedback: 'Acción rápida, respuesta incompleta',
        details:
          'Cerraste la puerta rápidamente, lo que evitó que la temperatura siguiera subiendo. Pero debiste haber reportado al equipo de infraestructura para que verificaran si hay daño temporal en los equipos. Sin validación, no sabes si todo funciona correctamente.',
      }
      run.recordDecision({ nivel: 'partial', riesgo: 2 })
    } else {
      result = {
        level: 'danger',
        feedback: 'Fallo crítico - Equipos comprometidos',
        details:
          'No hiciste nada. La puerta siguió abierta, la temperatura subió peligrosamente y los servidores comenzaron a apagarse automáticamente. Se perdieron transacciones en curso y hay riesgo de corrupción de datos. Un problema que pudo evitarse en segundos requiere ahora horas de recuperación.',
      }
      run.recordDecision({ nivel: 'danger', riesgo: 5 })
    }

    setResolved(result)
    void run.finish({
      endingId: result.level,
      outcome: outcomeForLevel(result.level),
    })
  }

  function onEmpezar() {
    setResolved(null)
  }

  const contexto: Contexto = {
    antes: (
      <>
        <p className="mb-3">
          En un datacenter, los puertos fríos son áreas críticas donde circula aire refrigerado a través de conductos.
          Si la puerta se abre, el aire caliente entra directamente y afecta inmediatamente a los servidores de producción.
        </p>
        <p className="font-semibold mb-2">Riesgos de no actuar rápido:</p>
        <ul className="list-disc list-inside space-y-1 text-sm mb-3">
          <li>Equipos se apagan por protección térmica</li>
          <li>Pérdida de transacciones en curso</li>
          <li>Corrupción potencial de datos</li>
          <li>Downtime del servicio</li>
        </ul>
      </>
    ),
    ahora: (
      <>
        <strong>Caminando por el datacenter</strong>, notas que la puerta del puerto frío está abierta. El aire caliente
        está entrando. <strong>¿Qué haces?</strong>
      </>
    ),
  }

  const decisionPanel = resolved ? (
    <div className="space-y-4">
      <div className="border-l-4 border-gray-400 pl-3 py-1">
        <p className="text-xs font-bold uppercase text-gray-700 mb-2">
          {resolved.feedback}
        </p>
        <p className="text-sm text-body leading-relaxed mb-3">
          {resolved.details}
        </p>

        {resolved.level === 'safe' && (
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-ink">Lo que hiciste bien:</p>
            <ul className="space-y-1 text-body">
              <li>✓ Actuaste INMEDIATAMENTE al notar la puerta abierta</li>
              <li>✓ Cerraste la puerta para contener el daño térmico</li>
              <li>✓ Reportaste al equipo de infraestructura</li>
              <li>✓ Permitiste validación de equipos</li>
            </ul>
          </div>
        )}

        {resolved.level === 'partial' && (
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-ink">Lo que faltó:</p>
            <ul className="space-y-1 text-body">
              <li>✓ Cerraste la puerta rápidamente</li>
              <li>✕ No reportaste al equipo</li>
              <li>✕ No validaste estado de equipos</li>
              <li>✕ No sabes si hay daño temporal</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-ink mb-3">¿Qué haces?</h3>
        <p className="text-sm text-body leading-relaxed">
          La puerta del puerto frío está abierta. El aire caliente está entrando y la temperatura sube rápidamente. Los servidores de producción están en riesgo.
        </p>
        <p className="text-sm text-body leading-relaxed font-semibold mt-2">
          Tienes menos de 3 minutos para actuar antes que ocurra un shutdown automático por protección térmica.
        </p>
      </div>

      <div>
        <button
          onClick={() => setMostrarPista(!mostrarPista)}
          className="text-sm font-medium text-link underline decoration-dotted underline-offset-4 transition hover:decoration-solid"
        >
          No sé por dónde empezar
        </button>
        {mostrarPista && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-body leading-relaxed">
            En emergencias de refrigeración, la clave es actuar INMEDIATAMENTE. Tienes tres opciones: cerrar la puerta solamente, reportar al equipo de infraestructura, o hacer ambas cosas. La mejor respuesta es la que combina acción rápida con comunicación.
          </div>
        )}
      </div>
    </div>
  )

  const Escena = () => (
    <div className="w-full h-full space-y-4 flex flex-col">
      {/* Imagen GRANDE ocupando todo el ancho */}
      <img
        src="/PuertaAbiertaServidores.jpeg"
        alt="Datacenter - Puerto Frío Abierto"
        className="w-full rounded shadow-md"
      />

      {/* Panel de estado compacto debajo */}
      <div className="bg-gray-100 border border-gray-300 rounded p-3 text-xs grid grid-cols-3 gap-3">
        <div className="bg-white rounded p-2 border-l-4 border-orange-500">
          <p className="text-gray-600 text-xs font-semibold">Temperatura</p>
          <p className="text-orange-600 font-bold text-sm">28.5°C ↑</p>
        </div>

        <div className="bg-white rounded p-2 border-l-4 border-red-500">
          <p className="text-gray-600 text-xs font-semibold">Servidores</p>
          <p className="text-red-600 font-bold text-sm">En Riesgo</p>
        </div>

        <div className="bg-white rounded p-2 border-l-4 border-yellow-500">
          <p className="text-gray-600 text-xs font-semibold">Normal</p>
          <p className="text-gray-700 font-bold text-sm">18°C</p>
        </div>
      </div>

      {/* Opciones de acción - Botones todos igual color */}
      <div className="flex gap-2">
        <button
          onClick={() => handleDecision('solo-cierra')}
          className="flex-1 px-3 py-3 rounded font-semibold text-gray-800 bg-gray-300 hover:bg-gray-400 transition text-sm"
        >
          Asegurar la puerta y seguir adelante
        </button>

        <button
          onClick={() => handleDecision('cierra-reporta')}
          className="flex-1 px-3 py-3 rounded font-semibold text-gray-800 bg-gray-300 hover:bg-gray-400 transition text-sm"
        >
          Reportar el incidente a infraestructura
        </button>

        <button
          onClick={() => handleDecision('nada')}
          className="flex-1 px-3 py-3 rounded font-semibold text-gray-800 bg-gray-300 hover:bg-gray-400 transition text-sm"
        >
          Observar la situación primero
        </button>
      </div>
    </div>
  )

  const pantalla = (
    <div className={`${dossierTheme.dossierTheme} ${styles.app}`}>
      <main className={styles.mainArea}>
        <div className={styles.sceneView}>
          <div className={styles.sceneCanvas}>
        <Escena />
          </div>
        </div>
      </main>
    </div>
  )

  const nota = (
    <div className="text-base leading-relaxed text-body">
      <p>
        En emergencias de refrigeración: actúa INMEDIATAMENTE. Cierra la puerta y reporta. Los segundos cuentan cuando
        equipos críticos están en riesgo.
      </p>
    </div>
  )

  return (
    <EscenarioLayout
      escenarioId="fisico/puertos-frios-datacenter"
      resumen="Puerto frío abierto — Responde bajo presión"
      contexto={contexto}
      nota={nota}
      identidad={[]}
      pantalla={pantalla}
      decision={decisionPanel}
      ocultarDecision={false}
      resultado={resolved ? resultVariant(resolved.level) : undefined}
      onEmpezar={onEmpezar}
      dispositivo="escritorio"
    />
  )
}

export default PuertosFriosColdAisle
