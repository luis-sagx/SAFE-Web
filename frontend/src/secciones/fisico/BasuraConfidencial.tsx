import { useState } from 'react'
import { Link } from 'react-router'

import dossierTheme from '../../styles/dossier-theme.module.css'

import styles from './BasuraConfidencial.module.css'

type Level = 'good' | 'bad' | 'partial'

interface Result {
  level: Level
  verdict: string
  outcome: string
}

const SCENARIOS = [
  {
    choice: 'deja',
    level: 'bad' as Level,
    verdict: 'Dejaste documentos confidenciales expuestos',
    outcome:
      'Los documentos siguen en la papelera, donde cualquiera —personal de limpieza, visitantes, o compañeros— puede verlos. Los salarios, evaluaciones y datos bancarios siguen siendo legibles.',
  },
  {
    choice: 'guarda',
    level: 'bad' as Level,
    verdict: 'Guardaste documentos ajenos sin autorización',
    outcome:
      'Sacaste documentos de la basura y los guardaste. Aunque tenías una intención defensiva, acabas de llevar información confidencial de personas que no son tú a un lugar privado.',
  },
  {
    choice: 'destruye',
    level: 'good' as Level,
    verdict: 'Destruiste los documentos apropiadamente',
    outcome:
      'Correcto. Llevar los documentos a la trituradora y destruirlos fue la acción defensiva correcta. Sacaste datos confidenciales de una zona común y los destruiste adecuadamente.',
  },
  {
    choice: 'reporta',
    level: 'good' as Level,
    verdict: 'Reportaste la exposición al supervisor',
    outcome:
      'También correcto. Reportar a tu supervisor que hay documentos confidenciales en la basura permite que se investigue quién los tiró sin autorización. Es un incidente que debe documentarse.',
  },
]

function BasuraConfidencial() {
  
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
        <p className={styles.introText}>Oficina Induplast · Zona común</p>

        <div className={styles.sceneBox}>
          <h2 className={styles.sceneTitle}>Basura sin destruir</h2>
          <p className={styles.sceneText}>
            Vas a la zona de descanso y ves la papelera llena de documentos impresos. Aunque están rotos, los papeles son
            legibles: evaluaciones de desempeño, salarios, y extractos bancarios.
          </p>

          <div className={styles.dataGrid}>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Papelera</span>
              <span className={styles.dataValue}>Zona común — accesible para todos</span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Contenido visible</span>
              <span className={styles.dataValue}>Evaluaciones de desempeño y nóminas</span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Más información</span>
              <span className={styles.dataValue}>Datos bancarios y contratos</span>
            </div>
          </div>
        </div>

        {!result && (
          <div className={styles.choicesBox}>
            <button className={styles.choiceBtn} onClick={() => handleChoice('deja')}>
              Dejarlos ahí, no es tu responsabilidad
            </button>
            <button className={styles.choiceBtn} onClick={() => handleChoice('guarda')}>
              Sacarlos y guardarlos en un armario privado
            </button>
            <button className={styles.choiceBtn} onClick={() => handleChoice('destruye')}>
              Destruir los documentos usando la trituradora
            </button>
            <button className={styles.choiceBtn} onClick={() => handleChoice('reporta')}>
              Reportar a tu supervisor para investigar
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

export default BasuraConfidencial
