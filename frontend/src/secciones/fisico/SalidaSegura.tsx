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

interface Resolved {
  level: Level
  feedback: string
}

function SalidaSegura() {
  const navigate = useNavigate()
  const run = useScenarioRun('fisico/salida-segura')

  const [closedTabs, setClosedTabs] = useState(0)
  const [savedDocuments, setSavedDocuments] = useState(false)
  const [computerLocked, setComputerLocked] = useState(false)
  const [resolved, setResolved] = useState<Resolved | null>(null)

  const stampFlash = useFlashTransition()

  function handleCloseTab() {
    if (closedTabs < 4) {
      setClosedTabs(closedTabs + 1)
    }
  }

  function handleSaveDocuments() {
    setSavedDocuments(true)
  }

  function handleLockComputer() {
    setComputerLocked(true)
  }

  function handleFinish() {
    run.recordDecision({ nivel: 'safe', riesgo: 0 })

    stampFlash.trigger(() => {
      const allCompleted = closedTabs === 4 && savedDocuments && computerLocked
      const result = allCompleted
        ? { level: 'safe' as Level, feedback: 'Excelente. Completaste todas las acciones de seguridad. Tu escritorio está protegido, nadie puede acceder sin contraseña.' }
        : { level: 'danger' as Level, feedback: 'No completaste todas las acciones. Documentos visibles o sesión desbloqueada invita a acceso no autorizado. Siempre completa todos los pasos.' }

      setResolved(result)
      void run.finish({
        endingId: result.level,
        outcome: allCompleted ? 'CORRECTO' : 'INCORRECTO',
      })
    }, 750)
  }

  function handleNext() {
    navigate('/seccion/fisico')
  }

  function onEmpezar() {
    setClosedTabs(0)
    setSavedDocuments(false)
    setComputerLocked(false)
    setResolved(null)
  }

  const contexto: Contexto = {
    antes: (
      <>
        La seguridad física es tan importante como la digital. Dejar documentos sensibles en el escritorio
        o una computadora desbloqueada invita al robo de información. Incluso en una oficina segura, debes
        seguir protocolos antes de irte.
      </>
    ),
    ahora: (
      <>
        <strong>Es fin de jornada</strong> y tienes documentos sensibles visibles y la computadora encendida.
        Mañana otros trabajadores y visitantes entrarán. Completa todas las acciones de seguridad antes de irte.
      </>
    ),
  }

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
                  <p className="font-semibold">Resumen de seguridad:</p>
                  <ul className="space-y-1">
                    <li>- Todas las pestañas cerradas: sin datos en caché</li>
                    <li>- Documentos guardados: sin información visible</li>
                    <li>- Computadora bloqueada: acceso protegido</li>
                  </ul>
                </div>
              )}

              <button type="button" className={styles.nextBtn} onClick={handleNext}>
                Siguiente
              </button>
            </div>
          ) : (
            <div className="space-y-6 mt-6">
              <div className="bg-muted rounded-lg p-4 border border-border">
                <h4 className="font-semibold text-heading mb-3">Pantalla de tu computadora:</h4>

                <div className="bg-gray-900 rounded p-3 border-4 border-gray-800">
                  <div className="flex gap-2 mb-2 bg-gray-800 p-2 rounded flex-wrap">
                    {[...Array(4)].map((_, i) => (
                      <button
                        key={i}
                        onClick={closedTabs > i ? undefined : handleCloseTab}
                        disabled={closedTabs > i}
                        className={`px-3 py-1 rounded text-xs transition ${
                          closedTabs > i
                            ? 'bg-gray-600 text-gray-500 line-through cursor-default'
                            : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                        }`}
                      >
                        {closedTabs > i ? 'X' : `Tab ${i + 1}`}
                      </button>
                    ))}
                  </div>

                  <div className="bg-gray-800 h-16 rounded flex items-center justify-center text-gray-400 text-xs">
                    {closedTabs === 4 ? 'Todas las pestañas cerradas' : `${4 - closedTabs} pestañas abiertas`}
                  </div>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4 border border-border">
                <h4 className="font-semibold text-heading mb-3">Documentos en el escritorio:</h4>

                <button
                  onClick={handleSaveDocuments}
                  disabled={savedDocuments}
                  className={`w-full px-4 py-3 rounded-lg transition text-sm font-medium ${
                    savedDocuments
                      ? 'bg-green-100 text-green-700 cursor-default border border-green-300'
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer border border-yellow-300'
                  }`}
                >
                  {savedDocuments ? 'Documentos guardados' : 'Guardar documentos confidenciales'}
                </button>
              </div>

              <div className="bg-muted rounded-lg p-4 border border-border">
                <h4 className="font-semibold text-heading mb-3">Bloquear computadora:</h4>

                <button
                  onClick={handleLockComputer}
                  disabled={computerLocked}
                  className={`w-full px-4 py-3 rounded-lg transition text-sm font-medium ${
                    computerLocked
                      ? 'bg-green-100 text-green-700 cursor-default border border-green-300'
                      : 'bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer border border-purple-300'
                  }`}
                >
                  {computerLocked ? 'Computadora bloqueada' : 'Bloquear (Ctrl+Alt+Suprimir)'}
                </button>
              </div>

              <button
                onClick={handleFinish}
                disabled={closedTabs < 4 || !savedDocuments || !computerLocked}
                className={`w-full px-4 py-3 rounded-lg font-medium transition ${
                  closedTabs < 4 || !savedDocuments || !computerLocked
                    ? 'bg-gray-300 text-gray-500 cursor-default opacity-50'
                    : 'bg-primary text-on-primary hover:bg-primary-active cursor-pointer'
                }`}
              >
                {closedTabs < 4 || !savedDocuments || !computerLocked
                  ? 'Completa todas las acciones'
                  : 'Estoy listo para irme'}
              </button>
            </div>
          )}
        </div>
      </main>

      <FlashOverlay active={stampFlash.active} />
    </div>
  )

  const nota = (
    <div className="text-base leading-relaxed text-body">
      <p>Cierra las pestañas, guarda los documentos y bloquea tu computadora antes de irte de la oficina.</p>
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
