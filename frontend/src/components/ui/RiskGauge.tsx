import styles from './RiskGauge.module.css'

function RiskGauge({ label, percent, valueText, color }) {
  return (
    <div className={styles.riskPanel}>
      <span className={styles.riskLabel}>{label}</span>
      <div className={styles.gaugeTrack}>
        <div className={styles.gaugeFill} style={{ width: `${percent}%`, background: color }} />
      </div>
      <span className={styles.riskValue}>{valueText}</span>
    </div>
  )
}

export default RiskGauge
