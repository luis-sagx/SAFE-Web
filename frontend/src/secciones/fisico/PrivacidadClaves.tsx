import { useState, useEffect } from 'react'
import EscenarioLayout from '../../components/EscenarioLayout'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import dossierTheme from '../../styles/dossier-theme.module.css'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import styles from './fisico.module.css'

type Level = 'safe' | 'danger'

interface Resolved {
  level: Level
  feedback: string
  details: string
}

const TABS = [
  { id: 'contraseñas', name: 'Contraseñas' },
  { id: 'emails', name: 'Emails' },
  { id: 'documentos', name: 'Documentos' },
]

const PASSWORDS = [
  { servicio: 'Gmail', usuario: 'juan.garcia@empresa.com', pass: 'Abc123!@#G2024' },
  { servicio: 'Banco Corporativo', usuario: 'juan.garcia', pass: 'SecurePass2024' },
  { servicio: 'Sistema Interno', usuario: 'jgarcia', pass: 'InternalSys#99' },
  { servicio: 'VPN Empresa', usuario: 'juan.garcia@vpn', pass: 'VPNPass2024!' },
]

const EMAILS = [
  { de: 'director@empresa.com', asunto: 'Aumento de salario aprobado', vista: 'no leído', importante: true },
  { de: 'rrhh@empresa.com', asunto: 'Información confidencial - Reestructuración', vista: 'no leído', importante: true },
  { de: 'finanzas@empresa.com', asunto: 'Presupuesto 2024 - Datos sensibles', vista: 'no leído', importante: true },
  { de: 'jefe.directo@empresa.com', asunto: 'Evaluación de desempeño confidencial', vista: 'no leído', importante: true },
]

const DOCUMENTS = [
  { nombre: 'salario_personal_2024.pdf', tamaño: '245 KB', modificado: 'Hoy' },
  { nombre: 'informacion_confidencial.docx', tamaño: '1.2 MB', modificado: 'Hace 2 días' },
  { nombre: 'contrato_negociacion.pdf', tamaño: '567 KB', modificado: 'Hace 1 semana' },
  { nombre: 'estrategia_2024.xlsx', tamaño: '3.4 MB', modificado: 'Hace 3 días' },
]

function PrivacidadClaves() {
  const run = useScenarioRun('fisico/privacidad-claves')

  const [openTabs, setOpenTabs] = useState<Set<string>>(new Set(['contraseñas', 'emails', 'documentos']))
  const [resolved, setResolved] = useState<Resolved | null>(null)
  const [mostrarPista, setMostrarPista] = useState(false)
  const [selectedTab, setSelectedTab] = useState<string>('contraseñas')
  const [timeLeft, setTimeLeft] = useState<number>(30)
  const [timerActive, setTimerActive] = useState(false)

  function closeTab(id: string) {
    const newTabs = new Set(openTabs)
    newTabs.delete(id)
    setOpenTabs(newTabs)

    // Si cerramos el tab seleccionado, cambiar a otro disponible
    if (selectedTab === id && newTabs.size > 0) {
      const firstAvailable = Array.from(newTabs)[0]!
      setSelectedTab(firstAvailable)
    }
  }

  useEffect(() => {
    if (!timerActive || resolved) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerActive(false)
          // Se acabó el tiempo
          const result: Resolved = {
            level: 'danger',
            feedback: 'Se acabó el tiempo',
            details: 'Tu compañero llegó antes de que cerraras la información. Vio todo: contraseñas, emails confidenciales y documentos personales. Esto pone en riesgo tu seguridad personal y la de la empresa.',
          }
          setResolved(result)
          run.recordDecision({ nivel: 'danger', riesgo: 5 })
          void run.finish({ endingId: 'peligro', outcome: 'INCORRECTO' })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timerActive, resolved, run])

  function handleFinish() {
    if (openTabs.size === 0) {
      const result: Resolved = {
        level: 'safe',
        feedback: 'Excelente. Privacidad protegida',
        details: 'Cerraste todas las pestañas con información sensible antes de que tu compañero llegara. No vio nada comprometedor. Actuaste correctamente bajo presión.',
      }
      setResolved(result)
      setTimerActive(false)
      run.recordDecision({ nivel: 'safe', riesgo: 0 })
      void run.finish({ endingId: 'seguro', outcome: 'CORRECTO' })
    } else {
      const result: Resolved = {
        level: 'danger',
        feedback: 'Información expuesta',
        details: 'No cerraste toda la información antes de que tu compañero llegara. Vio contraseñas, emails confidenciales y documentos personales. Esto pone en riesgo tu seguridad personal y la de la empresa.',
      }
      setResolved(result)
      setTimerActive(false)
      run.recordDecision({ nivel: 'danger', riesgo: 5 })
      void run.finish({ endingId: 'peligro', outcome: 'INCORRECTO' })
    }
  }

  function onEmpezar() {
    setOpenTabs(new Set(['contraseñas', 'emails', 'documentos']))
    setResolved(null)
    setTimeLeft(30)
    setTimerActive(true)
  }

  const contexto: Contexto = {
    antes: (
      <>
        <p className="mb-3">
          En una oficina compartida, otros pueden ver tu pantalla fácilmente. Si dejas información sensible visible, corres el riesgo de que alguien vea lo que no debería.
        </p>
        <p className="font-semibold mb-2">Cómo protegerte:</p>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Haz click en la X de cada pestaña para cerrarla</li>
          <li>Bloquea tu pantalla cuando todas estén cerradas</li>
          <li>Presiona "Terminar" para completar</li>
        </ol>
      </>
    ),
    ahora: (
      <>
        <strong>Un compañero se acerca a tu escritorio</strong>{' '}para hacerte una pregunta.
        Tu pantalla tiene <strong>tres pestañas abiertas con información sensible</strong>.
        <strong>¿Las cierras y bloqueas la pantalla?</strong>
      </>
    ),
  }

  const decisionPanel = resolved ? (
    <div className="space-y-4">
      <div className="border-l-4 border-gray-400 pl-3 py-1">
        <p className="text-xs font-bold uppercase text-gray-700 mb-2">{resolved.feedback}</p>
        <p className="text-sm text-body leading-relaxed">{resolved.details}</p>
      </div>
    </div>
  ) : (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-ink mb-3">¿Qué haces?</h3>
        <p className="text-sm text-body">Tu compañero está llegando. Tienes segundos para actuar.</p>
      </div>
      <button
        onClick={() => setMostrarPista(!mostrarPista)}
        className="text-sm font-medium text-link underline decoration-dotted"
      >
        No sé por dónde empezar
      </button>
      {mostrarPista && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-body">
          Haz click en la X de cada pestaña. Luego bloquea la pantalla.
        </div>
      )}
      <details className="text-sm leading-relaxed text-body">
        <summary className="cursor-pointer list-none font-medium text-link underline decoration-dotted underline-offset-4">
          ¿Cuándo termina el escenario?
        </summary>
        <p className="mt-2">
          Cuando cierres todo y presiones "Terminar", o cuando se acabe el tiempo antes de que
          termines. Los segundos corren mientras decides, igual que en la vida real.
        </p>
      </details>
    </div>
  )

  const pantalla = (
    <div className={`${dossierTheme.dossierTheme} ${styles.app}`}>
      <main className={styles.mainArea}>
        <div className={styles.sceneView} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom, #f5f5f5 0%, #e0e0e0 100%)', minHeight: '600px' }}>
          {/* Monitor simulado */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '95%', height: '90vh', maxHeight: '800px', gap: '0.5rem' }}>
            {/* Marco del monitor */}
            <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Pantalla del navegador */}
              <div className="overflow-hidden flex flex-col bg-white shadow-2xl relative" style={{ width: '100%', height: '100%', border: '8px solid #333', flex: 1 }}>
              {/* Barra de dirección */}
              <div className="bg-gray-100 border-b border-gray-300 px-3 py-2 flex items-center gap-2 text-xs">
                <span className="text-gray-600 cursor-pointer">◀</span>
                <span className="text-gray-600 cursor-pointer">▶</span>
                <span className="text-gray-700 font-mono flex-1 px-2 py-1 bg-white rounded border border-gray-300">escritorio.local</span>
              </div>

              {/* Pestañas */}
              <div className="bg-gray-50 border-b border-gray-300 flex overflow-x-auto">
                {TABS.map((tab) =>
                  openTabs.has(tab.id) ? (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTab(tab.id)}
                      className={`flex items-center gap-2 px-3 py-2 border-r border-gray-300 min-w-max group transition ${
                        selectedTab === tab.id
                          ? 'bg-white border-b-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-700">{tab.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          closeTab(tab.id)
                        }}
                        className="ml-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded px-1 text-sm transition"
                      >
                        ×
                      </button>
                    </button>
                  ) : null
                )}
              </div>

              {/* Contenido */}
              <div className="flex-1 bg-white p-4 overflow-y-auto">
                {openTabs.size > 0 ? (
                  <>
                    {selectedTab === 'contraseñas' && openTabs.has('contraseñas') && (
                      <div className="space-y-3">
                        <h3 className="font-bold text-sm text-gray-800 mb-4">Contraseñas guardadas</h3>
                        {PASSWORDS.map((pwd, idx) => (
                          <div key={idx} className="border border-gray-300 rounded p-3 bg-red-50">
                            <p className="font-semibold text-sm text-red-900">{pwd.servicio}</p>
                            <p className="text-xs text-gray-700 mt-2">
                              <span className="font-mono">Usuario: {pwd.usuario}</span>
                            </p>
                            <p className="text-xs text-gray-700">
                              <span className="font-mono">Contraseña: {pwd.pass}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedTab === 'emails' && openTabs.has('emails') && (
                      <div className="space-y-2">
                        <h3 className="font-bold text-sm text-gray-800 mb-4">Bandeja de entrada</h3>
                        {EMAILS.map((email, idx) => (
                          <div key={idx} className="border border-gray-300 rounded p-3 bg-blue-50 hover:bg-blue-100 transition cursor-pointer">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-gray-900">{email.de}</p>
                                <p className="text-xs text-gray-700 mt-1">{email.asunto}</p>
                              </div>
                              {email.importante && <span className="text-red-500 font-bold text-lg">!</span>}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{email.vista}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedTab === 'documentos' && openTabs.has('documentos') && (
                      <div className="space-y-2">
                        <h3 className="font-bold text-sm text-gray-800 mb-4">Documentos</h3>
                        {DOCUMENTS.map((doc, idx) => (
                          <div key={idx} className="border border-gray-300 rounded p-3 bg-yellow-50 hover:bg-yellow-100 transition cursor-pointer">
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-gray-900">{doc.nombre}</p>
                                <p className="text-xs text-gray-600">{doc.tamaño} • {doc.modificado}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p className="font-semibold">Todas las pestañas cerradas</p>
                    <p className="text-sm">Ahora bloquea tu pantalla antes de que tu compañero llegue</p>
                  </div>
                )}
              </div>

              {/* Controles */}
              <div className="bg-gray-100 border-t border-gray-300 p-3 flex gap-2 relative z-10">
                <div className={`flex-1 px-3 py-2 rounded font-semibold text-white text-center text-sm ${
                  timeLeft > 10 ? 'bg-green-500' : timeLeft > 5 ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  Tiempo: {timeLeft}s
                </div>
                <button
                  onClick={handleFinish}
                  disabled={resolved !== null}
                  className="flex-1 px-3 py-2 rounded font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm"
                >
                  Terminar
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )

  const nota = (
    <div className="text-base leading-relaxed text-body">
      <p>Protege tu información sensible cerrando pestañas y bloqueando tu pantalla cuando alguien se acerca.</p>
    </div>
  )

  return (
    <EscenarioLayout
      escenarioId="fisico/privacidad-claves"
      resumen="Privacidad: Protege tu pantalla cuando alguien se acerca"
      contexto={contexto}
      nota={nota}
      identidad={[]}
      pantalla={pantalla}
      decision={decisionPanel}
      ocultarDecision={false}
      resultado={resolved ? (resolved.level === 'safe' ? 'good' : 'bad') : undefined}
      onEmpezar={onEmpezar}
      dispositivo="escritorio"
    />
  )
}

export default PrivacidadClaves
