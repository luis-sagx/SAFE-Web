import RiskGauge from './RiskGauge.jsx'
import styles from './DossierHeader.module.css'

function DossierHeader({
  caseLabel,
  secondTab,
  riskLabel,
  gaugePercent,
  gaugeValueText,
  gaugeColor,
  participantName,
  participantRole,
}) {
  return (
    <>
      <header className={styles.dossierHeader}>
        <div className={styles.tabGroup}>
          <span className={`${styles.tab} ${styles.active}`}>{caseLabel}</span>
          <span className={styles.tab}>{secondTab}</span>
        </div>
        <RiskGauge
          label={riskLabel}
          percent={gaugePercent}
          valueText={gaugeValueText}
          color={gaugeColor}
        />
      </header>
      <div className={styles.participantStrip}>
        Participante: {participantName} · {participantRole}
      </div>
    </>
  )
}

export default DossierHeader
