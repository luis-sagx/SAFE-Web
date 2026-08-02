import type { StoryNode } from '../../hooks/useStoryEngine'

interface StoryResultPanelProps {
  node: StoryNode
  signalsTitle: string
  /** Llevan negritas <b>; es contenido fijo del código, nunca de un usuario. */
  signals: string[]
  rule: string
  restartLabel: string
  onRestart: () => void
  styles: Record<string, string>
}

function StoryResultPanel({
  node,
  signalsTitle,
  signals,
  rule,
  restartLabel,
  onRestart,
  styles,
}: StoryResultPanelProps) {
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
