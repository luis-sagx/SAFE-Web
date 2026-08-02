import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useParticipant } from '../../context/ParticipantContext.jsx'
import styles from './SaldoContable.module.css'

const OPTIONS = [
  {
    label: 'Buscaría el courier más cercano y enviaría la computadora de inmediato.',
    correct: false,
  },
  {
    label: 'Buscaría un delivery a mi conveniencia para cumplir con el envío.',
    correct: false,
  },
  {
    label:
      'No enviaría la computadora. Esperaría que el dinero se haga efectivo como saldo disponible.',
    correct: true,
  },
  {
    label: 'Enviaría el equipo porque el comprador ya envió un comprobante de pago.',
    correct: false,
  },
]

function SaldoContable() {
  const { profile, roleLabel, initials } = useParticipant()
  const [selectedIndex, setSelectedIndex] = useState(null)

  if (!profile) {
    return <Navigate to="/" replace />
  }

  const answered = selectedIndex !== null
  const isCorrect = answered && OPTIONS[selectedIndex].correct

  function handleSelect(index) {
    if (answered) {
      return
    }
    setSelectedIndex(index)
  }

  function handleReset() {
    setSelectedIndex(null)
  }

  function optionClassName(option, index) {
    if (!answered) {
      return styles.option
    }
    if (index === selectedIndex) {
      return `${styles.option} ${option.correct ? styles.correct : styles.incorrect}`
    }
    if (option.correct) {
      return `${styles.option} ${styles.correct}`
    }
    return styles.option
  }

  return (
    <div className={styles.appWrapper}>
      <Link to="/seccion/phishing" className={styles.backLink}>
        ← Volver a la sección
      </Link>

      <section className={styles.phone}>
        <header className={styles.statusBar}>
          <span>09:41</span>
          <span>●●● WiFi 🔋</span>
        </header>

        <section className={styles.bankHeader}>
          <div className={styles.bankTop}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>B</div>
              <span>Banco Seguro</span>
            </div>
            <div className={styles.profile}>{initials}</div>
          </div>
          <p className={styles.welcome}>Bienvenido/a, {profile.displayName}</p>
          <h1 className={styles.accountTitle}>Cuenta de Ahorros</h1>
        </section>

        <section className={styles.content}>
          <section className={styles.participantCard}>
            <div>
              <span className={styles.participantLabel}>Participante en prueba</span>
              <strong>{profile.displayName}</strong>
            </div>
            <span className={styles.participantRole}>{roleLabel}</span>
          </section>

          <section className={`${styles.card} ${styles.accountCard}`}>
            <div className={styles.accountRow}>
              <span>Cuenta principal</span>
              <strong>**** 2481</strong>
            </div>

            <div className={styles.balanceMain}>
              <small>Saldo actual</small>
              <div className={styles.availableBalance}>$1506.00</div>
            </div>

            <div className={styles.balanceDivider} />

            <div className={styles.balanceSecondary}>
              <div>
                <span className={styles.label}>Saldo contable</span>
                <span className={styles.pendingBadge}>Movimiento en proceso</span>
              </div>
              <div className={styles.accountingBalance}>$1000.00</div>
            </div>
          </section>

          <section className={`${styles.card} ${styles.miniDetail}`}>
            <div className={styles.detailRow}>
              <span>Estado de la transacción</span>
              <strong>En proceso</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Canal</span>
              <strong>Depósito / cheque</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Fecha de registro</span>
              <strong>Hoy · 14:21</strong>
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Últimos movimientos</h2>

            <div className={styles.transaction}>
              <div className={styles.txIcon}>↓</div>
              <div className={styles.txInfo}>
                <strong>Depósito por cheque</strong>
                <span>Pendiente · Hoy 14:21</span>
              </div>
              <div className={`${styles.txAmount} ${styles.pending}`}>+$1000.00</div>
            </div>

            <div className={styles.transaction}>
              <div className={`${styles.txIcon} ${styles.success}`}>✓</div>
              <div className={styles.txInfo}>
                <strong>Saldo anterior</strong>
                <span>Fondos disponibles</span>
              </div>
              <div className={`${styles.txAmount} ${styles.successText}`}>$1506.00</div>
            </div>
          </section>

          <section className={styles.scenarioCard}>
            <h2>Contexto</h2>
            <p>
              Estás vendiendo una computadora por <strong>$1000</strong> en redes sociales. Una
              persona te contacta, conversa contigo y te indica que realizará el pago.
            </p>
            <p>
              Luego te pide que envíes la computadora a otra ciudad del país mediante un delivery
              o courier. Después de unas horas te envía un supuesto recibo de pago.
            </p>
          </section>

          <section className={styles.chatCard}>
            <h2>Mensajes del comprador</h2>
            <div className={`${styles.message} ${styles.buyer}`}>
              Ya le hice el pago. Revise su cuenta, ya debe aparecer.
            </div>
            <div className={`${styles.message} ${styles.buyer}`}>
              Por favor envíeme la computadora hoy mismo. Ya tengo el delivery esperando.
            </div>
            <div className={`${styles.message} ${styles.pressure}`}>
              Me urge. Ya pagué. Si no envía ahora, voy a reportarlo.
            </div>
          </section>

          <section className={styles.callAlert}>
            <div className={styles.callIcon}>📞</div>
            <div>
              <strong>5 llamadas perdidas</strong>
              <span>El comprador insiste en que envíes el equipo inmediatamente.</span>
            </div>
          </section>

          <section className={`${styles.card} ${styles.quizCard}`}>
            <h2>¿Qué harías en esta situación?</h2>
            <p>
              El comprador envió un comprobante, el valor aparece como saldo contable, pero
              todavía no se refleja como dinero disponible confirmado.
            </p>

            {OPTIONS.map((option, index) => (
              <button
                key={option.label}
                type="button"
                className={optionClassName(option, index)}
                disabled={answered}
                onClick={() => handleSelect(index)}
              >
                {option.label}
              </button>
            ))}

            {answered && isCorrect && (
              <div className={`${styles.feedback} ${styles.feedbackOk}`}>
                <strong>Correcto.</strong>
                <p>
                  No debes entregar el producto hasta confirmar que el dinero esté disponible. El
                  saldo contable no significa que el pago ya sea definitivo.
                </p>
              </div>
            )}

            {answered && !isCorrect && (
              <div className={`${styles.feedback} ${styles.feedbackBad}`}>
                <strong>Riesgo alto de estafa.</strong>
                <p>
                  La presión, las llamadas constantes, el supuesto comprobante y el saldo
                  contable pendiente son señales de alerta. El pago podría ser rechazado o
                  reversado.
                </p>
              </div>
            )}

            {answered && (
              <div className={styles.lesson}>
                <h3>Lección de seguridad</h3>
                <ul>
                  <li>No entregues productos si el pago solo aparece como saldo contable.</li>
                  <li>Confirma que el dinero esté como saldo disponible.</li>
                  <li>No confíes únicamente en capturas o recibos enviados por terceros.</li>
                  <li>La presión y la urgencia son señales frecuentes de ingeniería social.</li>
                  <li>Verifica directamente en la banca oficial o comunícate con tu banco.</li>
                </ul>
              </div>
            )}

            {answered && (
              <button type="button" className={styles.resetBtn} onClick={handleReset}>
                Intentar nuevamente
              </button>
            )}
          </section>
        </section>

        <footer className={styles.footerNav}>
          <div className={styles.navItem}>
            <span>🏠</span>Inicio
          </div>
          <div className={styles.navItem}>
            <span>💳</span>Cuentas
          </div>
          <div className={styles.navItem}>
            <span>↔️</span>Transferir
          </div>
          <div className={styles.navItem}>
            <span>🔔</span>Alertas
          </div>
        </footer>
      </section>
    </div>
  )
}

export default SaldoContable
