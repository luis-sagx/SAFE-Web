import styles from './RiskGauge.module.css'

export interface RiskGaugeProps {
  label: string
  percent: number
  valueText: string
  color: string
}

function RiskGauge({ label, percent, valueText, color }: RiskGaugeProps) {
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
