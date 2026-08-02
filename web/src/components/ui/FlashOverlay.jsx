import styles from './FlashOverlay.module.css'

function FlashOverlay({ active }) {
  return <div className={`${styles.flashOverlay} ${active ? styles.active : ''}`} />
}

export default FlashOverlay
