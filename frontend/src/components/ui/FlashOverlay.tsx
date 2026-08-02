import styles from './FlashOverlay.module.css'

function FlashOverlay({ active }: { active: boolean }) {
  return <div className={`${styles.flashOverlay} ${active ? styles.active : ''}`} />
}

export default FlashOverlay
