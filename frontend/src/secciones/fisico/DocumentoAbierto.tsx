import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import DossierHeader from '../../components/ui/DossierHeader'
import FlashOverlay from '../../components/ui/FlashOverlay'
import { useFlashTransition } from '../../hooks/useFlashTransition'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import dossierTheme from '../../styles/dossier-theme.module.css'
import styles from './Foto.module.css'

type Level = 'safe' | 'warn' | 'danger'

interface Choice {
  label: string
  level: Level
  feedback: string
}

function DocumentoAbierto() {
  const { displayName, roleLabel } = useAuth()
  const run = useScenarioRun('fisico/documento-abierto')

  const [decided, setDecided] = useState(false)
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null)
  const flash = useFlashTransition()

  const choices: Choice[] = [
    {
      label: 'Leer rápido el documento para saber qué contiene',
      level: 'danger',
      feedback:
        'Acceder a información confidencial sin autorización es violación de privacidad y políticas de seguridad, aunque sea "un vistazo rápido". No importa lo que pretenda ser el documento.',
    },
    {
      label: 'Fotografiar el documento con el celular',
      level: 'danger',
      feedback:
        'Capturar documentos confidenciales es aún más grave: ahora la información está en tu dispositivo personal, posiblemente sincronizado a la nube, sin control de la empresa.',
    },
    {
      label: 'Dejarla ahí, no es tu asunto',
      level: 'warn',
      feedback:
        'Mejor que leerla, pero no reportar un documento confidencial expuesto deja el riesgo activo. Cualquier persona que pase por ese escritorio puede verlo o copiarlo.',
    },
    {
      label: 'Avisar al dueño del escritorio que dejó documentos visibles',
      level: 'safe',
      feedback:
        'Correcto. Reportar de forma discreta al compañero le permite guardar sus documentos de inmediato. Así proteges tanto la información como su responsabilidad ante la empresa.',
    },
    {
      label: 'Reportar a Recursos Humanos o Seguridad de inmediato',
      level: 'safe',
      feedback:
        'También correcto, aunque es más severo que avisar al dueño. Es la ruta adecuada si se trata de documentos de otros (clientes, empleados), no solo del compañero.',
    },
  ]

  const handleChoice = (choice: Choice) => {
    setSelectedChoice(choice)
    setDecided(true)

    flash.trigger(() => {
      run.recordDecision({
        opcion: choice.label,
        nivel: choice.level,
      })

      run.finish({
        endingId: choice.level,
        outcome:
          choice.level === 'safe'
            ? 'CORRECTO'
            : choice.level === 'warn'
              ? 'PARCIAL'
              : 'INCORRECTO',
      })
    }, 250)
  }

  const getResultLevel = () => {
    if (!selectedChoice) return null
    return selectedChoice.level === 'safe' ? 'safe' : 'danger'
  }

  const resultText = selectedChoice
    ? selectedChoice.level === 'safe'
      ? 'Actuaste correctamente'
      : selectedChoice.level === 'warn'
        ? 'No fue lo ideal'
        : 'Violaste políticas de seguridad'
    : ''

  return (
    <div className={`${dossierTheme.dossierTheme} ${styles.app}`}>
      <DossierHeader
        caseLabel="CASO #0725"
        secondTab="DECISIÓN"
        riskLabel="SEGURIDAD"
        gaugePercent={decided ? 100 : 0}
        gaugeValueText={decided ? '✓' : 'PENDIENTE'}
        gaugeColor={decided ? 'var(--safe)' : 'var(--amber)'}
        participantName={displayName}
        participantRole={roleLabel}
      />

      <main className={styles.mainArea}>
        <p className={styles.introText}>Corporativo · Oficina abierta</p>

        <div className={styles.instructionsBox}>
          <p className={styles.instructionsTitle}>Situación</p>
          <p style={{ marginBottom: '1rem' }}>
            Son las 12:30 PM. Tu compañero Andrés se levanta de su escritorio diciendo "voy al café, regreso en 15 minutos".
            Cuando se va, ves que dejó su monitor encendido con varios documentos impresos sobre el escritorio, entre ellos:
          </p>
          <ul style={{ marginBottom: '1rem' }}>
            <li>Un informe de evaluación de desempeño de empleados</li>
            <li>Datos de contacto de clientes con montos de contrato</li>
            <li>Accesos y contraseñas de sistemas (parcialmente tapados)</li>
          </ul>
          <p>
            Otros compañeros pasan por ese pasillo frecuentemente. El escritorio está en una zona común donde cualquiera puede verlo.
          </p>
        </div>

        <p className={styles.npcLine}>¿Qué haces?</p>

        {!decided && (
          <div style={{ marginTop: '2rem' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {choices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChoice(choice)}
                  style={{
                    padding: '1rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    backgroundColor: '#fff',
                    fontSize: '0.95rem',
                  }}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {decided && selectedChoice && (
          <div className={styles.report} style={{ marginTop: '2rem' }}>
            <span
              className={`${styles.reportStamp} ${getResultLevel() ? styles[getResultLevel()!] : ''}`}
            >
              {resultText.toUpperCase()}
            </span>
            <h2>{resultText}</h2>
            <p className={styles.summary}>{selectedChoice.feedback}</p>

            <div style={{ marginTop: '2rem' }}>
              <button
                onClick={() => window.location.reload()}
                className={styles.restartBtn}
              >
                Repetir el escenario
              </button>
            </div>
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
