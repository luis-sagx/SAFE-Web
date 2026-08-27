import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import DossierHeader from '../../components/ui/DossierHeader'
import FlashOverlay from '../../components/ui/FlashOverlay'
import { useFlashTransition } from '../../hooks/useFlashTransition'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import AppHeader from '../../components/AppHeader'
import InfoLink from '../../components/InfoLink'
import ContextoEscenario from '../../components/ui/ContextoEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import { getSeccion } from '../../data/catalogo'
import dossierTheme from '../../styles/dossier-theme.module.css'
import styles from './Foto.module.css'

type DocKey = 'evaluaciones' | 'clientes' | 'contrasena'

interface Document {
  label: string
  title: string
  risk: string
}

const DOCUMENTS: Record<DocKey, Document> = {
  evaluaciones: {
    label: 'Evaluaciones de desempeño',
    title: 'Evaluaciones de desempeño (CONFIDENCIAL)',
    risk: 'Violación grave de privacidad',
  },
  clientes: {
    label: 'Datos de clientes',
    title: 'Clientes activos - Montos de contrato',
    risk: 'Robo de información corporativa',
  },
  contrasena: {
    label: 'Nota con contraseña',
    title: 'Contraseña WiFi - Oficina',
    risk: 'Acceso no autorizado a la red',
  },
}

const DOCUMENT_DATA = {
  evaluaciones: [
    { nombre: 'Andrés García', salario: '$4.200', desempeño: '8.5/10', bono: '15%' },
    { nombre: 'María López', salario: '$3.800', desempeño: '9.2/10', bono: '20%' },
    { nombre: 'Juan Pérez', salario: '$3.500', desempeño: '7.8/10', bono: '10%' },
    { nombre: 'Laura Ruiz', salario: '$4.500', desempeño: '8.9/10', bono: '18%' },
  ],
  clientes: [
    { nombre: 'TechCorp Solutions', monto: '$125.000', margen: '28%', estado: 'Activo' },
    { nombre: 'Global Industries Inc', monto: '$89.500', margen: '32%', estado: 'Activo' },
    { nombre: 'DataStream Ltd', monto: '$156.000', margen: '25%', estado: 'Activo' },
  ],
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
  const stampFlash = useFlashTransition()
  const [decisions, setDecisions] = useState<Record<DocKey, DecisionResult | null>>({
    evaluaciones: null,
    clientes: null,
    contrasena: null,
  })
  const [finalResult, setFinalResult] = useState<{ goodCount: number; canAdvance: boolean } | null>(null)

  const handleInspectDoc = (docKey: DocKey) => {
    setInspectedDoc(docKey)
  }

  const handleDocumentAction = (actionId: string) => {
    if (actionId === 'foto') {
      setCameraFlash(true)
      setTimeout(() => setCameraFlash(false), 300)
    }

    const decisionResult = DECISION_RESULTS[actionId]
    if (!decisionResult || !inspectedDoc) return

    flash.trigger(() => {
      setResult(decisionResult)
      run.recordDecision({ documento: inspectedDoc, accion: actionId })

      // Guardar la decisión para este documento
      const updatedDecisions = { ...decisions, [inspectedDoc]: decisionResult }
      setDecisions(updatedDecisions)

      // Verificar si todos los documentos tienen decisiones
      const allDecided = updatedDecisions.evaluaciones && updatedDecisions.clientes && updatedDecisions.contrasena
      if (allDecided) {
        // Contar aciertos (good y partial son considerados aciertos)
        const goodCount = Object.values(updatedDecisions).filter(d => d && (d.level === 'good' || d.level === 'partial')).length
        const canAdvance = goodCount >= 2

        // Mostrar resultado final después de un delay
        setTimeout(() => {
          setFinalResult({ goodCount, canAdvance })
          void run.finish({
            endingId: canAdvance ? 'good' : 'bad',
            outcome: canAdvance ? 'CORRECTO' : 'INCORRECTO',
          })
        }, 1500)
      }

      stampFlash.trigger(() => {}, 750)
    }, 250)
  }

  const handleRestart = () => {
    run.restart()
    setInspectedDoc(null)
    setResult(null)
    setDecisions({ evaluaciones: null, clientes: null, contrasena: null })
    setFinalResult(null)
  }

  const handleNextDocument = () => {
    // Si ya se mostró el resultado final, no permitir continuar
    if (finalResult) return
    setInspectedDoc(null)
    setResult(null)
  }

  const docsCompleted = Object.values(decisions).filter(d => d !== null).length

  const contexto: Contexto = {
    antes: (
      <>
        Trabajas en una oficina donde hay documentos clasificados y confidenciales en cada escritorio. Tus
        compañeros, como tú, son responsables de proteger estos documentos cuando se alejan de sus puestos.
        El pasillo por donde caminas frecuentemente tiene varios escritorios a la vista.
      </>
    ),
    ahora: (
      <>
        <strong>Esta tarde, pausa de café.</strong> Pasas por el escritorio de tu compañero Andrés cuando se
        levanta diciendo {'"'}me voy por café, regreso en 15 minutos{'"'}. Mientras se va, ves que dejó su
        escritorio desatendido con tres tipos de documentos visibles: evaluaciones de desempeño de tu equipo,
        datos de clientes con montos de contrato, y una nota adhesiva con la contraseña del WiFi de la
        oficina.
      </>
    ),
  }

  if (!started) {
    const seccion = getSeccion('fisico')
    const volver = (
      <Link to="/seccion/fisico" className="text-base font-medium text-link underline">
        ← Volver a la sección
      </Link>
    )

    return (
      <div className="min-h-dvh bg-canvas">
        <AppHeader>
          {volver}
          <InfoLink />
        </AppHeader>

        <main className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-base font-medium text-muted">{seccion?.canal}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">Documento abierto</h1>

          <div className="mt-8">
            <p className="text-lg leading-relaxed text-ink">
              Hola, <strong className="font-semibold">{displayName}</strong>. Esto es lo que te está pasando:
            </p>

            <div className="mt-5">
              <ContextoEscenario contexto={contexto} />
            </div>

            <div className="mt-8 flex gap-4">
              <button
                type="button"
                onClick={() => setStarted(true)}
                className="min-h-12 rounded-md bg-primary px-7 py-3.5 text-lg font-medium text-on-primary transition hover:bg-primary-active"
              >
                Comenzar escenario
              </button>
            </div>
          </div>
        </main>
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
          @keyframes stampIn {
            0% {
              opacity: 0;
              transform: scale(3.2) rotate(-16deg);
            }
            35% {
              opacity: 1;
              transform: scale(0.92) rotate(-11deg);
            }
            48% {
              transform: scale(1.06) rotate(-11deg);
            }
            62% {
              transform: scale(1) rotate(-11deg);
            }
            82% {
              opacity: 1;
            }
            100% {
              opacity: 0;
              transform: scale(1) rotate(-11deg);
            }
          }
          .doc-button {
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .doc-button:hover {
            filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15));
            animation: paperFlip 0.6s ease-in-out;
          }
          .document-preview {
            padding: 56px 44px;
            background: #ffffff;
            border: none;
            border-radius: 2px;
            box-shadow:
              0 10px 25px rgba(0, 0, 0, 0.1),
              0 20px 40px rgba(0, 0, 0, 0.08),
              -2px 0 4px rgba(0, 0, 0, 0.05);
            margin: 24px auto;
            width: 100%;
            max-width: 580px;
            aspect-ratio: 8.5 / 11;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            transition: all 0.3s ease;
            position: relative;
            page-break-after: avoid;
            overflow-y: auto;
          }
          .document-preview:hover {
            box-shadow:
              0 15px 35px rgba(0, 0, 0, 0.15),
              0 25px 50px rgba(0, 0, 0, 0.1),
              -2px 0 4px rgba(0, 0, 0, 0.05);
            transform: translateY(-3px);
          }
          .document-preview::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 1px solid #f0f0f0;
            border-radius: 2px;
            pointer-events: none;
            opacity: 1;
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
          .stampOverlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            z-index: 50;
          }
          .stampOverlay.show {
            animation: fadeIn 0.2s ease-in;
          }
          .stamp {
            font-family: var(--font-sans);
            font-size: 2rem;
            font-weight: 700;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            border: 5px solid;
            border-radius: 10px;
            padding: 16px 30px;
            background: rgba(255, 255, 255, 0.1);
          }
          .stamp.good {
            color: var(--color-success);
            border-color: var(--color-success);
          }
          .stamp.bad {
            color: var(--color-danger);
            border-color: var(--color-danger);
          }
          .stamp.partial {
            color: var(--color-warning);
            border-color: var(--color-warning);
          }
          .stamp.show {
            animation: stampIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}</style>

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
                  <h3 style={{ margin: '0 0 32px 0', color: '#1a1a1a', fontSize: '1.2rem', fontWeight: '700', textAlign: 'center', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    {DOCUMENTS[inspectedDoc].title}
                  </h3>

                  {inspectedDoc === 'evaluaciones' && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--color-surface-strong)' }}>
                          <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: 'var(--color-ink)' }}>Empleado</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: 'var(--color-ink)' }}>Salario</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: 'var(--color-ink)' }}>Desempeño</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: 'var(--color-ink)' }}>Bono</th>
                        </tr>
                      </thead>
                      <tbody>
                        {DOCUMENT_DATA.evaluaciones.map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--color-hairline)', background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                            <td style={{ padding: '10px', color: 'var(--color-body)' }}>{row.nombre}</td>
                            <td style={{ padding: '10px', color: 'var(--color-body)', fontWeight: '500' }}>{row.salario}</td>
                            <td style={{ padding: '10px', color: 'var(--color-body)' }}>{row.desempeño}</td>
                            <td style={{ padding: '10px', color: 'var(--color-body)' }}>{row.bono}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {inspectedDoc === 'clientes' && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--color-surface-strong)' }}>
                          <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: 'var(--color-ink)' }}>Cliente</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: 'var(--color-ink)' }}>Monto</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: 'var(--color-ink)' }}>Margen</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: 'var(--color-ink)' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {DOCUMENT_DATA.clientes.map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--color-hairline)', background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                            <td style={{ padding: '10px', color: 'var(--color-body)' }}>{row.nombre}</td>
                            <td style={{ padding: '10px', color: 'var(--color-body)', fontWeight: '500' }}>{row.monto}</td>
                            <td style={{ padding: '10px', color: 'var(--color-body)' }}>{row.margen}</td>
                            <td style={{ padding: '10px', color: 'var(--color-primary)', fontWeight: '600' }}>{row.estado}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {inspectedDoc === 'contrasena' && (
                    <div style={{ background: 'var(--color-surface-strong)', padding: '16px', borderRadius: '6px', marginBottom: '20px', border: '1px dashed var(--color-hairline-strong)' }}>
                      <p style={{ margin: '0 0 12px 0', color: 'var(--color-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600' }}>Red WiFi</p>
                      <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-ink)', wordBreak: 'break-all' }}>
                        Of2026*Net!
                      </p>
                      <p style={{ margin: '12px 0 0 0', color: 'var(--color-body)', fontSize: '0.85rem' }}>
                        Contraseña actual del WiFi de la oficina
                      </p>
                    </div>
                  )}

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

                {result && (
                  <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40, backdropFilter: 'blur(2px)' }}>
                    <div style={{ background: 'white', borderRadius: '8px', padding: '40px 32px', maxWidth: '500px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
                      <span className={`${styles.reportStamp} ${styles[result.level]}`} style={{ display: 'block', marginBottom: '20px' }}>
                        {result.level === 'good' ? 'CORRECTO' : result.level === 'partial' ? 'PARCIAL' : 'INCORRECTO'}
                      </span>
                      <h2 style={{ margin: '0 0 12px', fontSize: '1.3rem', color: 'var(--color-ink)' }}>{result.title}</h2>
                      <p style={{ margin: '0 0 28px', color: 'var(--color-body)', lineHeight: '1.6' }}>{result.outcome}</p>
                      {docsCompleted < 3 && (
                        <p style={{ margin: '0 0 24px', color: 'var(--color-muted)', fontSize: '0.9rem' }}>
                          Documentos completados: {docsCompleted}/3
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        {docsCompleted < 3 ? (
                          <button type="button" className={styles.restartBtn} onClick={handleNextDocument} style={{ marginTop: 0, flex: 1 }}>
                            Siguiente documento
                          </button>
                        ) : (
                          <button type="button" className={styles.restartBtn} onClick={handleRestart} style={{ marginTop: 0, flex: 1 }}>
                            {finalResult?.canAdvance ? 'Continuar' : 'Repetir escenario'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
      </main>

      <FlashOverlay active={flash.active} />

      {result && (
        <div className={`stampOverlay ${stampFlash.active ? 'show' : ''}`}>
          <div className={`stamp ${result.level} ${stampFlash.active ? 'show' : ''}`}>
            {result.level === 'good' ? 'CORRECTO' : result.level === 'partial' ? 'PARCIAL' : 'INCORRECTO'}
          </div>
        </div>
      )}

      <Link to="/seccion/fisico" className={styles.backLink}>
        ← Volver a la sección
      </Link>
    </div>
  )
}

export default DocumentoAbierto
