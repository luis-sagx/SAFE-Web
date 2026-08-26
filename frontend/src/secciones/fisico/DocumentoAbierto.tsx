import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import DossierHeader from '../../components/ui/DossierHeader'
import FlashOverlay from '../../components/ui/FlashOverlay'
import { useFlashTransition } from '../../hooks/useFlashTransition'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import dossierTheme from '../../styles/dossier-theme.module.css'
import styles from './Baiting.module.css'

type Level = 'safe' | 'warn' | 'danger'

interface Choice {
  label: string
  level: Level
  risk: number
  feedback: string
}

function DocumentoAbierto() {
  const { displayName, roleLabel } = useAuth()
  const run = useScenarioRun('fisico/documento-abierto')

  const [choicesShown, setChoicesShown] = useState(false)
  const [resolved, setResolved] = useState<{ level: Level; feedback: string } | null>(null)
  const [totalRisk, setTotalRisk] = useState(0)
  const [revealPending, setRevealPending] = useState(false)

  const flash = useFlashTransition()
  const stampFlash = useFlashTransition()

  const choices: Choice[] = [
    {
      label: 'Leer rápido el documento para saber qué contiene',
      level: 'danger',
      risk: 35,
      feedback:
        'Acceder a información confidencial sin autorización es violación de privacidad y políticas de seguridad. No importa que sea "un vistazo rápido": viste datos que no autorizaban que vieras.',
    },
    {
      label: 'Fotografiar el documento con el celular',
      level: 'danger',
      risk: 40,
      feedback:
        'Capturar documentos confidenciales es aún más grave: ahora la información está en tu dispositivo personal, posiblemente sincronizado a la nube, completamente fuera del control de la empresa.',
    },
    {
      label: 'Dejarla ahí, no es mi responsabilidad',
      level: 'warn',
      risk: 15,
      feedback:
        'No accediste a los datos, pero no reportar un documento confidencial expuesto deja el riesgo activo. Cualquier persona que pase puede leerlo, copiarlo o fotografiarlo.',
    },
    {
      label: 'Avisar discretamente al compañero que dejó documentos visibles',
      level: 'safe',
      risk: 0,
      feedback:
        'Correcto. Reportar de forma discreta al dueño le permite guardar sus documentos de inmediato. Proteges tanto la información como su responsabilidad ante la empresa.',
    },
    {
      label: 'Reportar a Recursos Humanos o Seguridad',
      level: 'safe',
      risk: 0,
      feedback:
        'También correcto. Si se trata de documentos de terceros (clientes, empleados), reportar a las autoridades correspondientes es el protocolo adecuado.',
    },
  ]

  const handleFlashClick = () => {
    flash.trigger(() => {
      setChoicesShown(true)
    }, 190)
  }

  const handleChoice = (choice: Choice) => {
    setResolved({ level: choice.level, feedback: choice.feedback })
    setTotalRisk(choice.risk)
    setRevealPending(true)

    run.recordDecision({
      opcion: choice.label,
      nivel: choice.level,
      riesgo: choice.risk,
    })

    stampFlash.trigger(() => {
      setRevealPending(false)
      void run.finish({
        endingId: choice.level,
        outcome:
          choice.level === 'safe'
            ? 'CORRECTO'
            : choice.level === 'warn'
              ? 'PARCIAL'
              : 'INCORRECTO',
      })
    }, 750)
  }

  const verdictLabel = (level: Level) =>
    level === 'safe' ? 'Decisión segura' : level === 'warn' ? 'Observación' : 'Riesgo detectado'

  const stampWord = (level: Level) =>
    level === 'safe' ? 'APROBADO' : level === 'warn' ? 'OBSERVACIÓN' : 'RIESGO'

  const showFeedback = !!resolved && !revealPending

  const getBgColor = (level: Level) => {
    if (level === 'safe') return 'rgba(22, 163, 74, 0.1)' // success color light
    if (level === 'warn') return 'rgba(171, 100, 0, 0.1)' // warning color light
    return 'rgba(180, 52, 47, 0.1)' // danger color light
  }

  const getBorderColor = (level: Level) => {
    if (level === 'safe') return '#16a34a' // success
    if (level === 'warn') return '#ab6400' // warning
    return '#b4342f' // danger
  }

  const getStampBgColor = (level: Level) => {
    if (level === 'safe') return '#16a34a' // success
    if (level === 'warn') return '#ab6400' // warning
    return '#b4342f' // danger
  }

  return (
    <div className={`${dossierTheme.dossierTheme} ${styles.app}`}>
      <DossierHeader
        caseLabel="CASO #0725"
        secondTab="ESCRITORIO"
        riskLabel="NIVEL DE RIESGO"
        gaugePercent={totalRisk}
        gaugeValueText={`${totalRisk}%`}
        gaugeColor={
          totalRisk <= 15 ? 'var(--safe)' : totalRisk <= 30 ? 'var(--amber)' : 'var(--danger)'
        }
        participantName={displayName}
        participantRole={roleLabel}
      />

      <main className={styles.mainArea}>
        <div className={styles.instructionsBox}>
          <p className={styles.instructionsTitle}>Situación</p>
          <p>
            Son las 12:30 PM. Tu compañero Andrés se levanta diciendo "voy al café, regreso en 15 minutos". Cuando se va,
            ves que dejó su escritorio con varios documentos impresos visibles: evaluaciones de desempeño, datos de clientes
            con montos de contrato, y accesos a sistemas.
          </p>
          <p style={{ marginTop: '0.5rem' }}>
            Otros compañeros pasan frecuentemente por ese pasillo. El escritorio está en una zona común.
          </p>
        </div>

        <p className={styles.npcLine}>¿Qué haces?</p>

        <div className={styles.sceneWrap}>
          <svg viewBox="0 0 500 300" style={{ width: '100%', maxWidth: '500px', margin: '2rem auto' }}>
            {/* Escritorio */}
            <rect x="50" y="100" width="400" height="150" rx="8" fill="#e8e2d3" stroke="#999" strokeWidth="2" />

            {/* Monitor */}
            <rect x="80" y="60" width="120" height="80" rx="4" fill="#2c3e50" stroke="#333" strokeWidth="1.5" />
            <rect x="85" y="65" width="110" height="65" fill="#3a4552" />
            <rect x="90" y="115" width="100" height="15" fill="#b8b0a0" />

            {/* Documento 1 - confidencial */}
            <g>
              <rect x="220" y="110" width="100" height="70" fill="#f5f1e6" stroke="#999" strokeWidth="1.5" />
              <text x="270" y="125" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#b4342f">
                CONFIDENCIAL
              </text>
              <line x1="230" y1="135" x2="310" y2="135" stroke="#ccc" strokeWidth="1" />
              <line x1="230" y1="145" x2="310" y2="145" stroke="#ccc" strokeWidth="1" />
              <line x1="230" y1="155" x2="290" y2="155" stroke="#ccc" strokeWidth="1" />
              <line x1="230" y1="165" x2="310" y2="165" stroke="#ccc" strokeWidth="1" />
            </g>

            {/* Documento 2 */}
            <g>
              <rect x="330" y="120" width="95" height="60" fill="#faf7f0" stroke="#bbb" strokeWidth="1.5" transform="rotate(-8 377.5 150)" />
              <line x1="340" y1="130" x2="420" y2="130" stroke="#ddd" strokeWidth="1" />
              <line x1="340" y1="142" x2="420" y2="142" stroke="#ddd" strokeWidth="1" />
            </g>

            {/* Nota adhesiva con contraseña */}
            <g>
              <rect x="240" y="70" width="50" height="35" fill="#ffd966" stroke="#ccaa00" strokeWidth="1" transform="rotate(12 265 87.5)" />
              <text x="265" y="82" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#333">
                WiFi Ofc:
              </text>
              <text x="265" y="95" textAnchor="middle" fontSize="6" fill="#333" fontFamily="monospace">
                Of2026*Net!
              </text>
            </g>

            {/* Teclado */}
            <rect x="120" y="200" width="140" height="30" rx="3" fill="#2c3e50" stroke="#333" strokeWidth="1" />

            {/* Flash interactivo */}
            {!choicesShown && (
              <g className={styles.sceneFlash} transform="translate(150, 90)" onClick={handleFlashClick} style={{ cursor: 'pointer' }}>
                <circle className={styles.flashPulseSpark} r="20" />
                <circle className={styles.flashDot} r="16" fill="#ff9800" opacity="0.8" />
                <text className={styles.flashBoltText} y="2" fontSize="20">
                  ⚡
                </text>
              </g>
            )}
          </svg>
        </div>

        {choicesShown && !showFeedback && (
          <div style={{ marginTop: '2rem' }}>
            <p style={{ textAlign: 'center', marginBottom: '1rem', fontStyle: 'italic', color: '#666' }}>
              Elige tu acción:
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                maxWidth: '600px',
                margin: '0 auto',
              }}
            >
              {choices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChoice(choice)}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    backgroundColor: '#fff',
                    fontSize: '0.9rem',
                    color: '#171717',
                    fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f7'
                    e.currentTarget.style.borderColor = '#999'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff'
                    e.currentTarget.style.borderColor = '#ddd'
                  }}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {showFeedback && resolved && (
          <div style={{ marginTop: '2rem', maxWidth: '600px', margin: '2rem auto' }}>
            <div
              style={{
                backgroundColor: getBgColor(resolved.level),
                border: `2px solid ${getBorderColor(resolved.level)}`,
                borderRadius: '4px',
                padding: '1rem',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  backgroundColor: getStampBgColor(resolved.level),
                  color: 'white',
                  borderRadius: '3px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                }}
              >
                {stampWord(resolved.level)}
              </div>
              <h3 style={{ margin: '0.5rem 0', color: '#171717' }}>{verdictLabel(resolved.level)}</h3>
              <p style={{ margin: '0.5rem 0', lineHeight: '1.6', color: '#60646c' }}>{resolved.feedback}</p>

              <button
                onClick={() => window.location.reload()}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#006837',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Repetir el escenario
              </button>
            </div>
          </div>
        )}
      </main>

      <FlashOverlay active={flash.active || stampFlash.active} />

      <Link to="/seccion/fisico" className={styles.backLink}>
        ← Volver a la sección
      </Link>
    </div>
  )
}

export default DocumentoAbierto
