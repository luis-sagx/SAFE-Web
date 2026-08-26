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
  const [cameraFlash, setCameraFlash] = useState(false)

  const handleInspectDoc = (docKey: DocKey) => {
    setInspectedDoc(docKey)
  }

  const handleDocumentAction = (actionId: string) => {
    if (actionId === 'foto') {
      setCameraFlash(true)
      setTimeout(() => setCameraFlash(false), 300)
    }

    const decisionResult = DECISION_RESULTS[actionId]
    if (!decisionResult) return

    flash.trigger(() => {
      setResult(decisionResult)
      run.recordDecision({ documento: inspectedDoc, accion: actionId })
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
              Cuando inspecciones un documento, podrás interactuar directamente con él. Cada acción tiene
              consecuencias diferentes.
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
        <style>{`
          @keyframes docPulse {
            0%, 100% { transform: scale(1) translateY(0); }
            50% { transform: scale(1.05) translateY(-5px); }
          }
          @keyframes paperFlip {
            0% { opacity: 0.8; filter: brightness(1); }
            50% { opacity: 1; filter: brightness(1.1); }
            100% { opacity: 0.8; filter: brightness(1); }
          }
          @keyframes cameraFlashEffect {
            0% { opacity: 0; }
            50% { opacity: 1; }
            100% { opacity: 0; }
          }
          .doc-button {
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .doc-button:hover {
            filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15));
            animation: paperFlip 0.6s ease-in-out;
          }
          .document-preview {
            padding: 32px;
            background: var(--color-surface);
            border: 1px solid var(--color-hairline-strong);
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            margin-bottom: 24px;
            transition: all 0.3s ease;
          }
          .document-preview:hover {
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          }
          .action-buttons-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 12px;
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid var(--color-hairline);
          }
          .action-btn-inline {
            padding: 10px 14px;
            background: var(--color-primary);
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: Inter, sans-serif;
          }
          .action-btn-inline:hover {
            background: #00522b;
            transform: scale(1.05);
          }
          .flash-effect {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            opacity: 0;
            pointer-events: none;
            z-index: 100;
            animation: cameraFlashEffect 0.3s ease-out;
          }
        `}</style>

        {!result ? (
          <>
            {!inspectedDoc ? (
              <>
                <p className={styles.introText}>
                  Ves tres documentos distintos sobre el escritorio. Haz clic en cada uno para inspeccionarlo.
                </p>

                <div className={styles.deskWrap}>
                  <svg viewBox="0 0 600 320">
                    <defs>
                      <linearGradient id="deskGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f5f7f9" />
                        <stop offset="100%" stopColor="#eef1f5" />
                      </linearGradient>
                      <filter id="docShadow">
                        <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.15" />
                      </filter>
                    </defs>
                    <rect width="600" height="320" fill="url(#deskGradient)" />
                    <rect y="60" width="600" height="10" fill="#d9dfe5" />
                    <rect x="20" y="200" width="560" height="20" fill="#d4b896" />
                    <rect x="20" y="180" width="560" height="20" fill="#e0c4a0" />

                    <g
                      onClick={() => handleInspectDoc('evaluaciones')}
                      className="doc-button"
                      style={{ cursor: 'pointer' }}
                      filter="url(#docShadow)"
                    >
                      <rect x="60" y="80" width="140" height="100" rx="2" fill="#fafafa" stroke="#d0d0d0" strokeWidth="1.5" />
                      <rect x="65" y="85" width="130" height="8" fill="#60646c" opacity="0.7" />
                      <text x="75" y="102" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="600" fill="#1b232c">
                        Evaluaciones
                      </text>
                      <text x="75" y="117" fontFamily="Inter, sans-serif" fontSize="9" fontWeight="500" fill="#60646c">
                        de desempeño
                      </text>
                      <line x1="65" y1="125" x2="195" y2="125" stroke="#e0e0e0" strokeWidth="1" />
                      <text x="75" y="155" fontFamily="Inter, sans-serif" fontSize="8" fontWeight="500" fill="#60646c">
                        CONFIDENCIAL
                      </text>
                    </g>

                    <g
                      onClick={() => handleInspectDoc('clientes')}
                      className="doc-button"
                      style={{ cursor: 'pointer' }}
                      filter="url(#docShadow)"
                    >
                      <rect x="230" y="70" width="140" height="110" rx="2" fill="#fafafa" stroke="#d0d0d0" strokeWidth="1.5" transform="rotate(4 300 125)" />
                      <rect x="235" y="75" width="130" height="8" fill="#60646c" opacity="0.7" transform="rotate(4 300 125)" />
                      <text x="245" y="95" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="600" fill="#1b232c" transform="rotate(4 300 125)">
                        Clientes
                      </text>
                      <text x="245" y="112" fontFamily="Inter, sans-serif" fontSize="9" fontWeight="500" fill="#60646c" transform="rotate(4 300 125)">
                        Montos contrato
                      </text>
                      <line x1="235" y1="120" x2="365" y2="120" stroke="#e0e0e0" strokeWidth="1" transform="rotate(4 300 125)" />
                      <text x="255" y="150" fontFamily="Inter, sans-serif" fontSize="8" fontWeight="500" fill="#60646c" transform="rotate(4 300 125)">
                        DATOS CRÍTICOS
                      </text>
                    </g>

                    <g
                      onClick={() => handleInspectDoc('contrasena')}
                      className="doc-button"
                      style={{ cursor: 'pointer' }}
                      filter="url(#docShadow)"
                    >
                      <rect x="400" y="90" width="120" height="90" fill="#fffaf0" stroke="#d4c5a9" strokeWidth="1.5" transform="rotate(-8 460 135)" />
                      <rect x="402" y="92" width="116" height="86" fill="#fffcf7" rx="1" transform="rotate(-8 460 135)" />
                      <text x="415" y="115" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="600" fill="#1b232c" transform="rotate(-8 460 135)">
                        WiFi
                      </text>
                      <text x="415" y="130" fontFamily="monospace" fontSize="8" fontWeight="500" fill="#1b232c" transform="rotate(-8 460 135)">
                        Of2026*Net!
                      </text>
                      <circle cx="465" cy="100" r="4" fill="#60646c" opacity="0.4" />
                    </g>
                  </svg>
                </div>

                <div className={styles.instructionsBox} style={{ marginTop: '20px' }}>
                  <p className={styles.instructionsTitle}>Cómo interactuar</p>
                  <p className={styles.summary}>
                    Cuando inspeccionas un documento, aparecerán opciones para interactuar con él. Puedes leerlo,
                    fotografiarlo, ignorarlo, avisar al compañero o reportarlo a Recursos Humanos.
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className={styles.introText}>
                  Alguien podría pasar en cualquier momento. ¿Qué haces con este documento?
                </p>

                <div className="document-preview">
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-ink)', fontSize: '1.05rem', fontWeight: '600' }}>
                      {DOCUMENTS[inspectedDoc].title}
                    </h3>
                    <p style={{ margin: 0, color: 'var(--color-body)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                      {DOCUMENTS[inspectedDoc].content}
                    </p>
                  </div>

                  <div className="action-buttons-grid">
                    <button className="action-btn-inline" onClick={() => handleDocumentAction('lee')}>
                      Leer
                    </button>
                    <button className="action-btn-inline" onClick={() => handleDocumentAction('foto')}>
                      Fotografiar
                    </button>
                    <button className="action-btn-inline" onClick={() => handleDocumentAction('avisa')}>
                      Avisar
                    </button>
                    <button className="action-btn-inline" onClick={() => handleDocumentAction('reporta')}>
                      Reportar
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.snapBtn}
                  onClick={() => {
                    setInspectedDoc(null)
                  }}
                  style={{ background: 'transparent', color: 'var(--color-ink)', border: '2px solid var(--color-ink)', marginBottom: '20px' }}
                >
                  ← Volver a los documentos
                </button>

                <p style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.85rem', marginTop: '12px' }}>
                  Pasa el mouse sobre el documento para ver opciones
                </p>

                {cameraFlash && <div className="flash-effect" />}
              </>
            )}
          </>
        ) : (
          <div className={styles.report}>
            <span className={`${styles.reportStamp} ${styles[result.level]}`}>
              {result.level === 'good' ? 'CORRECTO' : result.level === 'partial' ? 'PARCIAL' : 'INCORRECTO'}
            </span>
            <h2>{result.title}</h2>
            <p className={styles.summary}>{result.outcome}</p>

            <button type="button" className={styles.restartBtn} onClick={handleRestart}>
              Repetir el escenario
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
