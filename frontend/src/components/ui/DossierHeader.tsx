import RiskGauge from './RiskGauge'
import styles from './DossierHeader.module.css'

interface DossierHeaderProps {
  caseLabel: string
  secondTab: string
  riskLabel: string
  gaugePercent: number
  gaugeValueText: string
  gaugeColor: string
  participantName: string
  participantRole: string
}

function DossierHeader({
  caseLabel,
  secondTab,
  riskLabel,
  gaugePercent,
  gaugeValueText,
  gaugeColor,
  participantName,
  participantRole,
}: DossierHeaderProps) {
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
