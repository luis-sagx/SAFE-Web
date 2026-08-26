import { useState } from 'react'
import { Link } from 'react-router'

import dossierTheme from '../../styles/dossier-theme.module.css'

import styles from './CarnetOlvidado.module.css'

type Level = 'good' | 'bad' | 'partial'

interface Result {
  level: Level
  verdict: string
  outcome: string
}

const SCENARIOS = [
  {
    choice: 'expone',
    level: 'bad' as Level,
    verdict: 'Expusiste públicamente los datos personales',
    outcome:
      'Publicar los datos de un empleado en el chat de la empresa es una violación grave de privacidad. Acabas de exponer su nombre, código de empleado y nivel de acceso a toda la organización.',
  },
  {
    choice: 'guarda',
    level: 'bad' as Level,
    verdict: 'Guardaste un documento de identificación sin autorización',
    outcome:
      'Un carnet de empleado es un documento de identidad y acceso. Guardarlo significa que podrías usarlo para impersonar a esa persona o acceder a áreas que no te corresponden.',
  },
  {
    choice: 'entrega',
    level: 'good' as Level,
    verdict: 'Actuaste correctamente entregando el documento',
    outcome:
      'Correcto. Entregar un carnet perdido al área de Seguridad o Recursos Humanos es lo apropiado. Ellos se encargarán de identificar al dueño de forma segura.',
  },
  {
    choice: 'deja',
    level: 'partial' as Level,
    verdict: 'No actuaste, dejaste el riesgo expuesto',
    outcome:
      'Dejar el carnet en el lugar donde lo encontraste es mejor que guardarlo, pero igualmente riesgoso. Cualquiera que pase podría encontrarlo y usarlo para acceder.',
  },
]

function CarnetOlvidado() {
  
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
        <p className={styles.introText}>Oficina Induplast · Vestíbulo</p>

        <div className={styles.sceneBox}>
          <h2 className={styles.sceneTitle}>Carnet de identificación olvidado</h2>
          <p className={styles.sceneText}>
            Encontraste un carnet de identificación en el piso del vestíbulo. Tiene toda la información de un empleado:
            nombre, número de empleado, foto, y nivel de acceso.
          </p>

          <div className={styles.dataGrid}>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Nombre</span>
              <span className={styles.dataValue}>Sergio Martín López</span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Código</span>
              <span className={styles.dataValue}>ID-287451 | Área: Operaciones</span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Acceso</span>
              <span className={styles.dataValue}>Nivel 3 (Áreas restringidas)</span>
            </div>
          </div>
        </div>

        {!result && (
          <div className={styles.choicesBox}>
            <button className={styles.choiceBtn} onClick={() => handleChoice('expone')}>
              Publicar en el chat: "¿De quién es este carnet?"
            </button>
            <button className={styles.choiceBtn} onClick={() => handleChoice('guarda')}>
              Guardarlo en tu escritorio "por si acaso"
            </button>
            <button className={styles.choiceBtn} onClick={() => handleChoice('entrega')}>
              Entregarlo al área de Seguridad o Recursos Humanos
            </button>
            <button className={styles.choiceBtn} onClick={() => handleChoice('deja')}>
              Dejarlo donde lo encontraste para que el dueño lo vea
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

export default CarnetOlvidado
