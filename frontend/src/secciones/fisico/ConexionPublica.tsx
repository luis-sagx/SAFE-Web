import { useState } from 'react'
import { Link } from 'react-router'

import dossierTheme from '../../styles/dossier-theme.module.css'

import styles from './ConexionPublica.module.css'

type Level = 'good' | 'bad' | 'partial'

interface Result {
  level: Level
  verdict: string
  outcome: string
}

const SCENARIOS = [
  {
    choice: 'envia',
    level: 'bad' as Level,
    verdict: 'Enviaste datos confidenciales por red pública sin cifrar',
    outcome:
      'El email que acabas de enviar viaja en texto plano a través del WiFi. Cualquiera en el café con una herramienta básica puede interceptar tu tráfico y leer toda la información.',
  },
  {
    choice: 'nube',
    level: 'bad' as Level,
    verdict: 'Sincronizaste datos con credenciales de empresa en red pública',
    outcome:
      'Cuando sincronizas con la nube de la empresa desde WiFi público, tu sesión viaja sin cifrar. Un atacante puede robar tus credenciales e infiltrarse en los sistemas de la empresa.',
  },
  {
    choice: 'celular',
    level: 'good' as Level,
    verdict: 'Usaste tu conexión cifrada propia',
    outcome:
      'Correcto. Tu hotspot de celular usa cifrado (4G/5G) que el WiFi público no tiene. Tu tráfico viaja encriptado. Es más lento, pero es seguro.',
  },
  {
    choice: 'espera',
    level: 'partial' as Level,
    verdict: 'Retrasaste pero evitaste el riesgo',
    outcome:
      'No es la opción ideal (esperar retrasa el trabajo), pero es la más segura. Cuando tienes datos sensibles, la seguridad pesa más que la comodidad.',
  },
]

function ConexionPublica() {
  
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
        <p className={styles.introText}>Café Amanecer · Zona de conexión</p>

        <div className={styles.sceneBox}>
          <h2 className={styles.sceneTitle}>WiFi público en café</h2>
          <p className={styles.sceneText}>
            Estás en un café esperando a un cliente. Necesitas enviar un informe con datos de la empresa antes de la
            reunión. El café ofrece WiFi gratis sin contraseña.
          </p>

          <div className={styles.dataGrid}>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Red disponible</span>
              <span className={styles.dataValue}>CafeAmanecer_Free (sin contraseña)</span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Encriptación</span>
              <span className={styles.dataValue}>Ninguna — tráfico visible</span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Usuarios</span>
              <span className={styles.dataValue}>23 dispositivos conectados</span>
            </div>
          </div>
        </div>

        {!result && (
          <div className={styles.choicesBox}>
            <button className={styles.choiceBtn} onClick={() => handleChoice('envia')}>
              Conectarte y enviar el informe por email
            </button>
            <button className={styles.choiceBtn} onClick={() => handleChoice('nube')}>
              Conectarte y guardar en la nube del trabajo
            </button>
            <button className={styles.choiceBtn} onClick={() => handleChoice('celular')}>
              Usar el hotspot de tu celular con dato móvil
            </button>
            <button className={styles.choiceBtn} onClick={() => handleChoice('espera')}>
              Esperar a una conexión segura
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

export default ConexionPublica
