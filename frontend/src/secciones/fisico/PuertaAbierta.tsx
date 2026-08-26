import { useState } from 'react'
import { Link } from 'react-router'

import dossierTheme from '../../styles/dossier-theme.module.css'

import styles from './PuertaAbierta.module.css'

type Level = 'good' | 'bad' | 'partial'

interface Result {
  level: Level
  verdict: string
  outcome: string
}

const SCENARIOS = [
  {
    choice: 'entra',
    level: 'bad' as Level,
    verdict: 'Accediste sin autorización a área restringida',
    outcome:
      'Entrar a la sala de servidores sin permiso es una violación de seguridad grave. Aunque la puerta estuviera abierta, el acceso a esa área está restringido. Esto es suficiente para terminar tu empleo.',
  },
  {
    choice: 'lleva',
    level: 'bad' as Level,
    verdict: 'Permitiste acceso no autorizado a un tercero',
    outcome:
      'Llevar a alguien a un área restringida sin autorización es aún peor. Acabas de exponer equipo crítico a una persona sin autorización. Si esa persona daña algo, tú eres responsable.',
  },
  {
    choice: 'cierra',
    level: 'partial' as Level,
    verdict: 'Protegiste el acceso pero no reportaste',
    outcome:
      'Cerrar la puerta fue correcto, pero dejar pasar el incidente es arriesgado. Alguien olvidó asegurar un área crítica. Reportar asegura que se investigue.',
  },
  {
    choice: 'reporta',
    level: 'good' as Level,
    verdict: 'Actuaste correctamente cerrando y reportando',
    outcome:
      'Perfecto. Cerraste la puerta (acción defensiva inmediata) y reportaste (protocolo). Ellos pueden investigar por qué la puerta se abrió y asegurar el área correctamente.',
  },
]

function PuertaAbierta() {
  
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
        <p className={styles.introText}>Oficina Induplast · Infraestructura</p>

        <div className={styles.sceneBox}>
          <h2 className={styles.sceneTitle}>Puerta de oficina abierta</h2>
          <p className={styles.sceneText}>
            Pasando por un pasillo, notas que la puerta de la sala de servidores está abierta. No tiene el cierre
            automático activado. Esta es un área restringida normalmente.
          </p>

          <div className={styles.dataGrid}>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Sala</span>
              <span className={styles.dataValue}>Sala de servidores y equipos de red</span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Acceso normal</span>
              <span className={styles.dataValue}>Requiere pase de seguridad</span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Estado</span>
              <span className={styles.dataValue}>Puerta abierta sin cierre de seguridad</span>
            </div>
          </div>
        </div>

        {!result && (
          <div className={styles.choicesBox}>
            <button className={styles.choiceBtn} onClick={() => handleChoice('entra')}>
              Entrar rápido a ver qué hay
            </button>
            <button className={styles.choiceBtn} onClick={() => handleChoice('lleva')}>
              Llevar a un compañero visitante a verla
            </button>
            <button className={styles.choiceBtn} onClick={() => handleChoice('cierra')}>
              Cerrar la puerta sin hacer nada más
            </button>
            <button className={styles.choiceBtn} onClick={() => handleChoice('reporta')}>
              Cerrar la puerta y reportar a Seguridad
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

export default PuertaAbierta
