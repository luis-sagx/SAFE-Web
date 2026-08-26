import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import DossierHeader from '../../components/ui/DossierHeader'
import FlashOverlay from '../../components/ui/FlashOverlay'
import { useFlashTransition } from '../../hooks/useFlashTransition'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import dossierTheme from '../../styles/dossier-theme.module.css'
import styles from './Foto.module.css'

type DocKey = 'evaluaciones' | 'clientes' | 'contrasena'

interface Document {
  label: string
  title: string
  content: string
  risk: string
}

const DOCUMENTS: Record<DocKey, Document> = {
  evaluaciones: {
    label: 'Evaluaciones de desempeño',
    title: 'Evaluaciones de desempeño (CONFIDENCIAL)',
    content:
      'Salarios, comentarios de desempeño, calificaciones y metas de empleados de tu equipo. Información que afecta sus contratos y futuro en la empresa.',
    risk: 'Violación grave de privacidad',
  },
  clientes: {
    label: 'Datos de clientes',
    title: 'Montos de contrato de clientes',
    content:
      'Clientes activos con sus montos de contrato, márgenes de ganancia y detalles del proyecto. Información estratégica competitiva.',
    risk: 'Robo de información corporativa',
  },
  contrasena: {
    label: 'Nota con contraseña',
    title: 'Contraseña WiFi de la oficina',
    content: 'WiFi: Of2026*Net! - Escrita a mano en una nota adhesiva visible',
    risk: 'Acceso no autorizado a la red',
  },
}

const DECISIONS = [
  { id: 'lee', text: 'Leer rápido el documento', level: 'bad' as const },
  { id: 'foto', text: 'Fotografiar el documento', level: 'bad' as const },
  { id: 'ignora', text: 'Ignorarlo, no es mi responsabilidad', level: 'partial' as const },
  { id: 'avisa', text: 'Avisar al compañero discretamente', level: 'good' as const },
  { id: 'reporta', text: 'Reportar a Recursos Humanos', level: 'good' as const },
]

interface DecisionResult {
  id: string
  level: 'good' | 'bad' | 'partial'
  title: string
  outcome: string
}

const DECISION_RESULTS: Record<string, DecisionResult> = {
  lee: {
    id: 'lee',
    level: 'bad',
    title: 'Violaste políticas de seguridad',
    outcome:
      'Acceder a información confidencial sin autorización es una falta grave. No importa que sea "un vistazo rápido": viste datos que no autorizaban que vieras.',
  },
  foto: {
    id: 'foto',
    level: 'bad',
    title: 'Capturaste datos confidenciales',
    outcome:
      'Fotografiar documentos es más grave aún: ahora la información está en tu dispositivo personal, posiblemente sincronizado a la nube, completamente fuera del control de la empresa.',
  },
  ignora: {
    id: 'ignora',
    level: 'partial',
    title: 'No actuaste, pero dejaste el riesgo activo',
    outcome:
      'No accediste a los datos, pero no reportar significa que cualquier otra persona que pase puede leerlo, copiarlo o fotografiarlo. El riesgo sigue activo.',
  },
  avisa: {
    id: 'avisa',
    level: 'good',
    title: 'Actuaste correctamente de forma discreta',
    outcome:
      'Correcto. Reportar discretamente al compañero le permite guardar sus documentos de inmediato. Proteges tanto la información como su responsabilidad.',
  },
  reporta: {
    id: 'reporta',
    level: 'good',
    title: 'Seguiste el protocolo oficial',
    outcome:
      'También correcto. Si los documentos contienen información de terceros, reportar a Recursos Humanos o Seguridad es el protocolo adecuado. Es la ruta más formal.',
  },
}

function DocumentoAbierto() {
  const { displayName, roleLabel } = useAuth()
  const run = useScenarioRun('fisico/documento-abierto')
  const flash = useFlashTransition()

  const [started, setStarted] = useState(false)
  const [inspectedDoc, setInspectedDoc] = useState<DocKey | null>(null)
  const [result, setResult] = useState<DecisionResult | null>(null)

  const handleInspectDoc = (docKey: DocKey) => {
    setInspectedDoc(docKey)
  }

  const handleDecision = (decisionId: string) => {
    const decisionResult = DECISION_RESULTS[decisionId]
    if (!decisionResult) return

    flash.trigger(() => {
      setResult(decisionResult)
      run.recordDecision({ documento: inspectedDoc, accion: decisionId })
      void run.finish({
        endingId: decisionResult.level,
        outcome: decisionResult.level === 'good' ? 'CORRECTO' : decisionResult.level === 'partial' ? 'PARCIAL' : 'INCORRECTO',
      })
    }, 250)
  }

  const handleRestart = () => {
    run.restart()
    setInspectedDoc(null)
    setResult(null)
  }

  if (!started) {
    return (
      <div className={`${dossierTheme.dossierTheme} ${styles.app}`}>
        <DossierHeader
          caseLabel="RIESGO FÍSICO"
          secondTab="INTRODUCCIÓN"
          riskLabel="RIESGO"
          gaugePercent={0}
          gaugeValueText=""
          gaugeColor="var(--color-primary)"
          participantName={displayName}
          participantRole={roleLabel}
        />

        <main className={styles.mainArea}>
          <p className={styles.introText}>
            Hola, {displayName}. Es una tarde normal en la oficina cuando ves que un compañero dejó su escritorio
            sin vigilancia mientras va por café. Lo que te llama la atención: hay documentos confidenciales visibles.
          </p>

          <div className={styles.instructionsBox}>
            <p className={styles.instructionsTitle}>Contexto</p>
            <p className={styles.summary}>
              Tu compañero Andrés se fue al café por 15 minutos. En su escritorio ves: evaluaciones de desempeño de tu
              equipo, datos de clientes con montos de contrato, y una nota adhesiva con la contraseña del WiFi. Otros
              compañeros caminan frecuentemente por este pasillo.
            </p>
            <p className={styles.summary}>
              La decisión que tomes determina si accedes a esa información, si la reportas, o si simplemente la ignoras.
              Cada opción tiene consecuencias diferentes.
            </p>
          </div>

          <div className={styles.actionRow}>
            <button type="button" className={styles.snapBtn} onClick={() => setStarted(true)}>
              Comenzar escenario →
            </button>
          </div>
        </main>

        <Link to="/seccion/fisico" className={styles.backLink}>
          ← Volver a la sección
        </Link>
      </div>
    )
  }

  return (
    <div className={`${dossierTheme.dossierTheme} ${styles.app}`}>
      <DossierHeader
        caseLabel="RIESGO FÍSICO"
        secondTab="DOCUMENTOS"
        riskLabel="ACCIÓN"
        gaugePercent={0}
        gaugeValueText=""
        gaugeColor="var(--color-primary)"
        participantName={displayName}
        participantRole={roleLabel}
      />

      <main className={styles.mainArea}>
        <p className={styles.introText}>
          Ves tres documentos distintos sobre el escritorio de tu compañero. Haz clic en cada uno para inspeccionarlo y
          luego decide qué hacer.
        </p>

        {!result ? (
          <>
            {!inspectedDoc ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  {(Object.entries(DOCUMENTS) as [DocKey, Document][]).map(([key, doc]) => (
                    <button
                      key={key}
                      onClick={() => handleInspectDoc(key)}
                      className={styles.snapBtn}
                      style={{
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, #00522b 100%)',
                        padding: '20px',
                        textAlign: 'left',
                        height: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <strong style={{ fontSize: '0.95rem', marginBottom: '4px' }}>📄 {doc.label}</strong>
                      <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>Haz clic para inspeccionar</span>
                    </button>
                  ))}
                </div>

                <div className={styles.instructionsBox} style={{ marginTop: '20px' }}>
                  <p className={styles.instructionsTitle}>💡 Cómo jugar</p>
                  <p className={styles.summary}>
                    Haz clic en cada documento para leer su contenido. Después de inspeccionarlo, podrás decidir qué
                    hacer: leerlo completo, fotografiarlo, ignorarlo, avisar al compañero, o reportarlo a Recursos
                    Humanos.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className={styles.instructionsBox} style={{ marginBottom: '20px', background: 'rgba(22, 163, 74, 0.08)', borderLeft: '3px solid #16a34a' }}>
                  <p className={styles.instructionsTitle} style={{ color: '#16a34a', margin: '0 0 12px 0' }}>
                    {DOCUMENTS[inspectedDoc].title}
                  </p>
                  <p className={styles.summary} style={{ margin: 0 }}>
                    {DOCUMENTS[inspectedDoc].content}
                  </p>
                  <p style={{ marginTop: '12px', color: '#b4342f', fontWeight: '600', fontSize: '0.85rem' }}>
                    ⚠ Riesgo: {DOCUMENTS[inspectedDoc].risk}
                  </p>
                </div>

                <p className={styles.introText}>¿Qué haces ahora que viste este documento?</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                  {DECISIONS.map((decision) => (
                    <button
                      key={decision.id}
                      onClick={() => handleDecision(decision.id)}
                      className={styles.snapBtn}
                      style={{
                        background: decision.level === 'good' ? '#16a34a' : decision.level === 'partial' ? '#d99b34' : '#b4342f',
                        padding: '14px 16px',
                        fontSize: '0.85rem',
                      }}
                    >
                      {decision.text}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className={styles.snapBtn}
                  onClick={() => setInspectedDoc(null)}
                  style={{ background: 'transparent', color: 'var(--color-ink)', border: '2px solid var(--color-ink)', marginBottom: '20px' }}
                >
                  ← Volver a los documentos
                </button>
              </>
            )}
          </>
        ) : (
          <div className={styles.report}>
            <span className={`${styles.reportStamp} ${styles[result.level]}`}>
              {result.level === 'good' ? '✓ CORRECTO' : result.level === 'partial' ? '! PARCIAL' : '✕ INCORRECTO'}
            </span>
            <h2>{result.title}</h2>
            <p className={styles.summary}>{result.outcome}</p>

            <button type="button" className={styles.restartBtn} onClick={handleRestart}>
              ↻ Repetir el escenario
            </button>
          </div>
        )}
      </main>

      <FlashOverlay active={flash.active} />

      <Link to="/seccion/fisico" className={styles.backLink}>
        ← Volver a la sección
      </Link>
    </div>
  )
}

export default DocumentoAbierto
