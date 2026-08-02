/**
 * Panel de resultado final de un grafo STORY (veredicto + señales + regla
 * de oro + reiniciar). `styles` es el CSS module del escenario que lo usa.
 * Las señales y la regla traen negritas <b> en el texto original, por eso
 * se inyectan como HTML (contenido propio, fijo en el código — no viene de
 * ningún usuario).
 */
function StoryResultPanel({ node, signalsTitle, signals, rule, restartLabel, onRestart, styles }) {
  const isGood = node.kind === 'good'

  return (
    <div className={`${styles.result} ${isGood ? styles.good : styles.bad}`}>
      <p className={styles.verdict}>
        <span className={styles.badge}>{isGood ? '✓' : '✕'}</span>
        {node.verdict}
      </p>
      <p className={styles.outcome}>{node.outcome}</p>
      <div className={styles.panel}>
        <h4>{signalsTitle}</h4>
        <ul className={styles.signals}>
          {signals.map((signal) => (
            <li key={signal}>
              <span className={styles.b}>•</span>
              <span dangerouslySetInnerHTML={{ __html: signal }} />
            </li>
          ))}
        </ul>
        <div className={styles.rule} dangerouslySetInnerHTML={{ __html: rule }} />
      </div>
      <button type="button" className={styles.again} onClick={onRestart}>
        {restartLabel}
      </button>
    </div>
  )
}

export default StoryResultPanel
