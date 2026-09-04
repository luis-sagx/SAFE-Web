import { useState } from 'react'
import { useNavigate } from 'react-router'
import EscenarioLayout from '../../components/EscenarioLayout'
import FlashOverlay from '../../components/ui/FlashOverlay'
import { useFlashTransition } from '../../hooks/useFlashTransition'
import { useSiguienteEscenario } from '../../hooks/useSiguienteEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import dossierTheme from '../../styles/dossier-theme.module.css'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import styles from './Baiting.module.css'

type Level = 'safe' | 'warn' | 'danger'

interface Resolved {
  level: Level
  feedback: string
}

interface ClosedItems {
  tabs: Set<number>
  documents: Set<number>
  computerLocked: boolean
}

interface TabContent {
  name: string
  content: string
}

const TAB_CONTENTS: TabContent[] = [
  { name: 'Nóminas 2026', content: 'Salarios y datos bancarios' },
  { name: 'Contraseñas', content: 'Usuario: admin Pass: Seg2026!' },
  { name: 'Clientes VIP', content: 'Información confidencial' },
  { name: 'Reportes', content: 'Reportes financieros' },
]

function SalidaSegura() {
  const navigate = useNavigate()
  const run = useScenarioRun('fisico/salida-segura')
  const { ruta: siguienteRuta } = useSiguienteEscenario('fisico/salida-segura')

  const [closed, setClosed] = useState<ClosedItems>({
    tabs: new Set(),
    documents: new Set(),
    computerLocked: false,
  })
  const [activeTab, setActiveTab] = useState<number | null>(null)
  const [resolved, setResolved] = useState<Resolved | null>(null)

  const stampFlash = useFlashTransition()

  function handleTabClick(tabIndex: number) {
    if (closed.tabs.has(tabIndex)) return
    setActiveTab(activeTab === tabIndex ? null : tabIndex)
  }

  function handleCloseTab(tabIndex: number) {
    const newTabs = new Set(closed.tabs)
    newTabs.add(tabIndex)
    setClosed({ ...closed, tabs: newTabs })
    if (activeTab === tabIndex) setActiveTab(null)
  }

  function handleRemoveDocument(docIndex: number) {
    const newDocs = new Set(closed.documents)
    newDocs.add(docIndex)
    setClosed({ ...closed, documents: newDocs })
  }

  function handleLockComputer() {
    setClosed({ ...closed, computerLocked: true })
  }

  function handleFinish() {
    const allTabsClosed = closed.tabs.size === 4
    const allDocumentsRemoved = closed.documents.size === 3
    const computerLocked = closed.computerLocked

    run.recordDecision({ nivel: 'safe', riesgo: 0 })

    stampFlash.trigger(() => {
      const allCompleted = allTabsClosed && allDocumentsRemoved && computerLocked

      const result = allCompleted
        ? {
            level: 'safe' as Level,
            feedback:
              'Excelente. Cerraste todas las pestañas, guardaste todos los documentos y bloqueaste tu computadora. Tu escritorio está completamente protegido.',
          }
        : {
            level: 'danger' as Level,
            feedback:
              'No completaste todas las acciones. Información sensible expuesta invita a acceso no autorizado. Siempre completa todos los pasos antes de irte.',
          }

      setResolved(result)
      void run.finish({
        endingId: result.level,
        outcome: allCompleted ? 'CORRECTO' : 'INCORRECTO',
      })
    }, 750)
  }

  function handleNext() {
    if (siguienteRuta) navigate(siguienteRuta)
  }

  function onEmpezar() {
    setClosed({ tabs: new Set(), documents: new Set(), computerLocked: false })
    setActiveTab(null)
    setResolved(null)
  }

  const contexto: Contexto = {
    antes: (
      <>
        <p className="mb-3">
          La seguridad física es tan importante como la digital. Dejar datos sensibles visibles invita al robo
          de información. Antes de irte de la oficina, siempre asegura tu espacio completamente.
        </p>
        <p className="font-semibold mb-2">Qué debes hacer:</p>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Haz click en las pestañas del navegador para ver los datos</li>
          <li>Cierra cada pestaña haciendo click en la X</li>
          <li>Guarda los documentos haciéndoles click</li>
          <li>Bloquea la computadora con el botón</li>
        </ol>
      </>
    ),
    ahora: (
      <>
        <strong>Es fin de jornada</strong>. Tu navegador tiene pestañas abiertas con datos sensibles, hay documentos
        confidenciales en el escritorio y tu computadora está sin bloquear. Otros entrarán mañana. Asegura tu espacio completamente.
      </>
    ),
  }

  const ESCENA = () => (
    <svg viewBox="0 0 1000 700" className="w-full">
      {/* Fondo pared */}
      <rect width="1000" height="700" fill="#f5e6d3" />

      {/* Piso */}
      <rect y="580" width="1000" height="120" fill="#d4a574" />

      {/* Libros en el lado izquierdo */}
      <rect x="100" y="300" width="20" height="100" fill="#d42020" />
      <rect x="125" y="310" width="20" height="90" fill="#2874a6" />
      <rect x="150" y="320" width="20" height="80" fill="#239b56" />
      <rect x="175" y="305" width="20" height="95" fill="#af601a" />

      {/* Lámpara de escritorio */}
      <g transform="translate(850, 250)">
        <rect x="0" y="80" width="12" height="80" fill="#555" />
        <ellipse cx="6" cy="80" rx="30" ry="12" fill="#daa520" />
        <circle cx="6" cy="100" r="25" fill="#ffd700" opacity="0.7" />
      </g>

      {/* Reloj en la pared */}
      <circle cx="900" cy="200" r="40" fill="#f5f5f5" stroke="#333" strokeWidth="3" />
      <line x1="900" y1="200" x2="900" y2="170" stroke="#333" strokeWidth="3" />
      <line x1="900" y1="200" x2="925" y2="200" stroke="#333" strokeWidth="3" />

      {/* Escritorio - Mesa grande */}
      <rect x="80" y="450" width="840" height="130" fill="#a67c52" stroke="#8a5a3a" strokeWidth="4" rx="10" />
      <rect x="95" y="460" width="810" height="110" fill="#c9915f" rx="8" />

      {/* Monitor ENORME - ocupa casi toda la escena */}
      <g transform="translate(150, 80)">
        {/* Base monitor grande */}
        <rect x="200" y="360" width="100" height="30" fill="#444" />
        <rect x="180" y="390" width="140" height="15" fill="#333" />

        {/* Pantalla GRANDE */}
        <rect x="0" y="0" width="500" height="360" fill="#1a1a1a" stroke="#555" strokeWidth="8" rx="12" />

        {/* Barra de dirección */}
        <rect x="20" y="20" width="460" height="40" fill="#333" rx="8" />
        <text x="250" y="48" textAnchor="middle" fontSize="20" fill="#999">
          https://company.internal
        </text>

        {/* Pestañas GRANDES */}
        {TAB_CONTENTS.map((tab, i) => {
          const isClosed = closed.tabs.has(i)
          const isActive = activeTab === i
          const tabX = 30 + i * 110

          return (
            <g key={i}>
              <rect
                x={tabX}
                y="70"
                width="100"
                height="50"
                fill={isClosed ? '#555' : isActive ? '#0078d4' : '#666'}
                rx="8"
                stroke="#222"
                strokeWidth="2"
                style={{ cursor: isClosed ? 'default' : 'pointer' }}
                onClick={() => !isClosed && handleTabClick(i)}
                opacity={isClosed ? 0.5 : 1}
              />

              <text
                x={tabX + 50}
                y="105"
                textAnchor="middle"
                fontSize="16"
                fill={isClosed ? '#888' : isActive ? '#fff' : '#ccc'}
                fontWeight="bold"
                style={{ cursor: isClosed ? 'default' : 'pointer', pointerEvents: 'none' }}
              >
                {tab.name.substring(0, 10)}
              </text>

              {!isClosed && (
                <g
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleCloseTab(i)}
                >
                  <circle
                    cx={tabX + 90}
                    cy="80"
                    r="10"
                    fill={isActive ? '#ff6b6b' : '#ff8888'}
                    opacity="0.9"
                  />
                  <text
                    x={tabX + 90}
                    y="87"
                    textAnchor="middle"
                    fontSize="16"
                    fill="#fff"
                    fontWeight="bold"
                  >
                    ✕
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* Contenido pantalla GRANDE */}
        {activeTab !== null && !closed.tabs.has(activeTab) && TAB_CONTENTS[activeTab] ? (
          <g>
            <rect x="20" y="130" width="460" height="220" fill="#f9f9f9" rx="8" />
            <text x="40" y="165" fontSize="24" fill="#333" fontWeight="bold">
              {TAB_CONTENTS[activeTab]!.name}
            </text>
            <line x1="30" y1="175" x2="480" y2="175" stroke="#ddd" strokeWidth="2" />
            <text x="40" y="215" fontSize="18" fill="#666" fontFamily="monospace">
              {TAB_CONTENTS[activeTab]!.content}
            </text>
          </g>
        ) : (
          <g>
            <rect x="20" y="130" width="460" height="220" fill="#2a2a2a" rx="8" />
            <text x="250" y="245" textAnchor="middle" fontSize="24" fill="#666">
              {closed.tabs.size === 4 ? 'TODO CERRADO' : 'Haz click en las pestañas'}
            </text>
          </g>
        )}

        {/* Indicador de bloqueo */}
        {closed.computerLocked && (
          <g>
            <circle cx="250" cy="200" r="80" fill="none" stroke="#16a34a" strokeWidth="6" opacity="0.8" />
            <text x="250" y="215" textAnchor="middle" fontSize="28" fill="#16a34a" fontWeight="bold">
              BLOQUEADO
            </text>
          </g>
        )}
      </g>

      {/* Documentos grandes distribuidos EN la mesa */}
      <g transform="translate(0, 0)">
        {!closed.documents.has(0) && (
          <g style={{ cursor: 'pointer' }} onClick={() => handleRemoveDocument(0)}>
            <rect x="100" y="475" width="90" height="70" fill="#fff" stroke="#999" strokeWidth="2" rx="5" />
            <line x1="112" y1="492" x2="178" y2="492" stroke="#ddd" strokeWidth="1" />
            <line x1="112" y1="505" x2="178" y2="505" stroke="#ddd" strokeWidth="1" />
            <line x1="112" y1="518" x2="168" y2="518" stroke="#ddd" strokeWidth="1" />
            <text x="145" y="560" textAnchor="middle" fontSize="11" fill="#333" fontWeight="bold">
              Contratos
            </text>
          </g>
        )}

        {!closed.documents.has(1) && (
          <g style={{ cursor: 'pointer' }} onClick={() => handleRemoveDocument(1)}>
            <rect x="810" y="475" width="90" height="70" fill="#fff" stroke="#999" strokeWidth="2" rx="5" />
            <line x1="822" y1="492" x2="888" y2="492" stroke="#ddd" strokeWidth="1" />
            <line x1="822" y1="505" x2="888" y2="505" stroke="#ddd" strokeWidth="1" />
            <line x1="822" y1="518" x2="878" y2="518" stroke="#ddd" strokeWidth="1" />
            <text x="855" y="560" textAnchor="middle" fontSize="11" fill="#333" fontWeight="bold">
              Nóminas
            </text>
          </g>
        )}

        {!closed.documents.has(2) && (
          <g style={{ cursor: 'pointer' }} onClick={() => handleRemoveDocument(2)}>
            <rect x="450" y="490" width="100" height="70" fill="#fff" stroke="#999" strokeWidth="2" rx="5" />
            <line x1="465" y1="507" x2="535" y2="507" stroke="#ddd" strokeWidth="1" />
            <line x1="465" y1="520" x2="535" y2="520" stroke="#ddd" strokeWidth="1" />
            <line x1="465" y1="533" x2="525" y2="533" stroke="#ddd" strokeWidth="1" />
            <text x="500" y="575" textAnchor="middle" fontSize="11" fill="#333" fontWeight="bold">
              Datos Bancarios
            </text>
          </g>
        )}
      </g>

      {/* Botón de bloquear GRANDE debajo en el piso */}
      <g transform="translate(310, 615)">
        <rect x="0" y="0" width="180" height="50" fill={closed.computerLocked ? '#10b981' : '#a78bfa'} rx="10" stroke="#666" strokeWidth="3" style={{ cursor: 'pointer' }} onClick={handleLockComputer} />
        <text x="90" y="20" textAnchor="middle" fontSize="16" fill="#fff" fontWeight="bold">
          {closed.computerLocked ? '🔒 Bloqueada' : '⌨️ Bloquear'}
        </text>
        <text x="90" y="42" textAnchor="middle" fontSize="12" fill="#fff">
          Ctrl+Alt+Supr
        </text>
      </g>


    </svg>
  )

  const pantalla = (
    <div className={`${dossierTheme.dossierTheme} ${styles.app}`}>
      <main className={styles.mainArea}>
        <div className={styles.sceneView}>
          <div className={styles.sceneMeta}>
            <span>OFICINA</span>
            <span>5:50 PM</span>
          </div>
          <h3 className={styles.sceneLocation}>Fin de jornada</h3>

          {resolved ? (
            <div className={styles.feedbackPanel}>
              <div className={styles.verdictRow}>
                <span className={`${styles.badge} ${styles[resolved.level]}`}>
                  {resolved.level === 'safe' ? 'Decisión segura' : 'Riesgo detectado'}
                </span>
              </div>
              <p className={styles.feedbackText}>{resolved.feedback}</p>

              {resolved.level === 'safe' && (
                <div className="mt-4 space-y-2 text-sm text-body">
                  <p className="font-semibold">Acciones completadas:</p>
                  <ul className="space-y-1">
                    <li>- 4 pestañas cerradas</li>
                    <li>- 3 documentos guardados</li>
                    <li>- Computadora bloqueada</li>
                  </ul>
                </div>
              )}

              <button type="button" className={styles.nextBtn} onClick={handleNext}>
                Siguiente
              </button>
            </div>
          ) : (
            <div className="space-y-6 mt-6">
              <div className={styles.sceneCanvas}>
                <ESCENA />
              </div>

              <div className="flex gap-4">

                <button
                  onClick={handleFinish}
                  disabled={closed.tabs.size < 4 || closed.documents.size < 3 || !closed.computerLocked}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                    closed.tabs.size < 4 || closed.documents.size < 3 || !closed.computerLocked
                      ? 'bg-gray-300 text-gray-500 cursor-default opacity-50'
                      : 'bg-primary text-on-primary hover:bg-primary-active cursor-pointer'
                  }`}
                >
                  {closed.tabs.size < 4 || closed.documents.size < 3 || !closed.computerLocked
                    ? `Completa todo (${closed.tabs.size}/4, ${closed.documents.size}/3)`
                    : 'Listo para irme'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <FlashOverlay active={stampFlash.active} />
    </div>
  )

  const nota = (
    <div className="text-base leading-relaxed text-body">
      <p>Asegura tu escritorio: cierra las pestañas, guarda los documentos y bloquea tu computadora.</p>
    </div>
  )

  return (
    <EscenarioLayout
      escenarioId="fisico/salida-segura"
      resumen="Fin de jornada — Protege tu escritorio"
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

export default SalidaSegura
