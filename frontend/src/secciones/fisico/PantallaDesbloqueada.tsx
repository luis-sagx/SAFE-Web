import { useState } from 'react'
import { Link } from 'react-router'
import dossierTheme from '../../styles/dossier-theme.module.css'
import styles from './PantallaDesbloqueada.module.css'

type Level = 'good' | 'bad' | 'partial'

interface Result {
  level: Level
  verdict: string
  outcome: string
}

const SCENARIOS = [
  {
    choice: 'lee',
    level: 'bad' as Level,
    verdict: 'Violaste la privacidad y confidencialidad',
    outcome:
      'Acceder a los correos de un compañero sin permiso es una falta grave. El hecho de que la pantalla esté sin vigilancia no te da derecho a usarla.',
  },
  {
    choice: 'modifica',
    level: 'bad' as Level,
    verdict: 'Cometiste fraude al intentar manipular transferencias',
    outcome:
      'Intentar usar el acceso de otra persona para hacer transacciones financieras es fraude. Esto tendría consecuencias legales graves.',
  },
  {
    choice: 'espera',
    level: 'partial' as Level,
    verdict: 'No actuaste, pero dejaste el riesgo activo',
    outcome:
      'No hiciste nada incorrecto personalmente, pero tampoco actuaste para reducir el riesgo. La pantalla sigue disponible para cualquiera.',
  },
  {
    choice: 'bloquea',
    level: 'good' as Level,
    verdict: 'Actuaste correctamente para proteger datos ajenos',
    outcome:
      'Perfecto. Bloquear la pantalla de un compañero que se olvidó es lo correcto: proteges sus datos, su sesión y su responsabilidad.',
  },
]

function PantallaDesbloqueada() {
  const [result, setResult] = useState<Result | null>(null)

  const handleChoice = (choice: string) => {
    const scenario = SCENARIOS.find((s) => s.choice === choice)
    if (scenario) {
      const res: Result = {
        level: scenario.level,
        verdict: scenario.verdict,
        outcome: scenario.outcome,
      }
      setResult(res)
    }
  }

  const handleRestart = () => {
    setResult(null)
  }

  return (
    <div className={`${dossierTheme.dossierTheme} ${styles.app}`}>
      <main className={styles.mainArea}>
        <p className={styles.introText}>Oficina Induplast · Puesto de trabajo</p>

        <div className={styles.sceneBox}>
          <h2 className={styles.sceneTitle}>Pantalla desbloqueada sin vigilancia</h2>
          <p className={styles.sceneText}>
            Tu compañero de equipo se levantó de su escritorio para ir por café. Su pantalla quedó completamente desbloqueada
            con tres ventanas importantes abiertas.
          </p>

          <div className={styles.dataGrid}>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Acceso</span>
              <span className={styles.dataValue}>Sistema de nómina (RRHH) - sesión activa</span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Correos</span>
              <span className={styles.dataValue}>Carpeta de proyectos confidenciales</span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Aplicación</span>
              <span className={styles.dataValue}>App de transferencias del área contable</span>
            </div>
          </div>
        </div>

        {!result && (
          <div className={styles.choicesBox}>
            <button className={styles.choiceBtn} onClick={() => handleChoice('lee')}>
              Revisar rápidamente los correos de la carpeta confidencial
            </button>
            <button className={styles.choiceBtn} onClick={() => handleChoice('modifica')}>
              Hacer una transferencia de prueba desde la app contable
            </button>
            <button className={styles.choiceBtn} onClick={() => handleChoice('espera')}>
              Esperar a que regrese sin tocar nada
            </button>
            <button className={styles.choiceBtn} onClick={() => handleChoice('bloquea')}>
              Bloquear la pantalla (Ctrl+Alt+L o Win+L)
            </button>
          </div>
        )}

        {result && (
          <div className={`${styles.resultBox}`}>
            <span className={`${styles.resultStamp} ${styles[result.level]}`}>{result.verdict}</span>
            <p className={styles.resultText}>{result.outcome}</p>
            <button className={styles.restartBtn} onClick={handleRestart}>
              ↻ Volver a intentar
            </button>
          </div>
        )}
      </main>

      <Link to="/seccion/fisico" className={styles.backLink}>
        ← Volver a la sección
      </Link>
    </div>
  )
}

export default PantallaDesbloqueada
