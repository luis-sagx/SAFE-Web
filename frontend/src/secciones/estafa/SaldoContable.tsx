import { useState } from 'react'
import EscenarioLayout from '../../components/EscenarioLayout'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import { useAuth } from '../../context/AuthContext'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import styles from './SaldoContable.module.css'

interface Option {
  label: string
  correct: boolean
}

const OPTIONS: Option[] = [
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

const RESUMEN = 'Vendés una computadora por $1000 y el comprador dice que ya te pagó.'

/** Los mensajes del comprador llegaron por otra app: son parte del contexto que
 *  el participante lee antes de abrir su banca, no de la pantalla del banco. */
const CONTEXTO: Contexto = {
  antes: (
    <>
      Estás vendiendo una computadora por <strong>$1000</strong> en redes sociales. Un comprador
      conversa con vos, te dice que ya hizo el pago y te pide enviarla a otra ciudad por delivery o
      courier.
    </>
  ),
  ahora: (
    <>
      <strong>Unas horas después</strong> te manda un supuesto recibo de pago, y abrís la
      aplicación de tu banco para ver si el dinero entró.
    </>
  ),
  extra: (
    <div className="rounded-lg border border-hairline-strong bg-canvas-soft p-4">
      <p className="text-sm font-semibold text-ink">Lo que te escribió el comprador</p>
      <ul className="mt-3 grid gap-2 text-base leading-relaxed text-body">
        <li>“Ya le hice el pago. Revise su cuenta, ya debe aparecer.”</li>
        <li>“Por favor envíeme la computadora hoy mismo. Ya tengo el delivery esperando.”</li>
        <li className="text-danger">“Me urge. Ya pagué. Si no envía ahora, voy a reportarlo.”</li>
      </ul>
    </div>
  ),
}

function SaldoContable() {
  const { displayName, initials } = useAuth()
  const run = useScenarioRun('estafa/saldo-contable')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const answered = selectedIndex !== null
  const isCorrect = answered && Boolean(OPTIONS[selectedIndex]?.correct)

  function handleSelect(index: number) {
    if (answered) {
      return
    }

    setSelectedIndex(index)
    run.recordDecision({ opcion: index, label: OPTIONS[index]?.label })
    void run.finish({
      endingId: `opcion-${index}`,
      outcome: OPTIONS[index]?.correct ? 'CORRECTO' : 'INCORRECTO',
    })
  }

  function handleReset() {
    setSelectedIndex(null)
    run.restart()
  }

  function optionClassName(option: Option, index: number) {
    const base =
      'flex min-h-11 w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-base leading-relaxed transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link'

    if (!answered) {
      return `${base} border-hairline-strong bg-surface text-ink hover:border-link/50 hover:bg-canvas-soft`
    }
    if (option.correct) {
      return `${base} border-success bg-success/10 font-medium text-ink`
    }
    if (index === selectedIndex) {
      return `${base} border-danger bg-danger/10 font-medium text-ink`
    }
    return `${base} border-hairline bg-surface text-muted`
  }

  const pantalla = (
    <section className={styles.phone} aria-label="Aplicación bancaria">
      <header className={styles.statusBar}>
        <span>09:41</span>
        <span>●●● WiFi 🔋</span>
      </header>

      <div className={styles.scroll}>
        <section className={styles.bankHeader}>
          <div className={styles.bankTop}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>B</div>
              <span>Banco Seguro</span>
            </div>
            <div className={styles.profile}>{initials}</div>
          </div>
          <p className={styles.welcome}>Bienvenido/a, {displayName}</p>
          <h1 className={styles.accountTitle}>Cuenta de Ahorros</h1>
        </section>

        <section className={styles.content}>
          <section className={`${styles.card} ${styles.accountCard}`}>
            <div className={styles.accountRow}>
              <span>Cuenta principal</span>
              <strong>**** 2481</strong>
            </div>

            <div className={styles.balanceMain}>
              <small>Saldo disponible</small>
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

          <div className={styles.callBanner}>
            <div className={styles.callIcon} aria-hidden>
              📞
            </div>
            <div>
              <strong>5 llamadas perdidas</strong>
              <span>El comprador insiste en que envíes el equipo inmediatamente.</span>
            </div>
          </div>

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
        </section>
      </div>

      <footer className={styles.footerNav}>
        <div className={styles.navItem}>
          <span aria-hidden>🏠</span>Inicio
        </div>
        <div className={styles.navItem}>
          <span aria-hidden>💳</span>Cuentas
        </div>
        <div className={styles.navItem}>
          <span aria-hidden>↔️</span>Transferir
        </div>
        <div className={styles.navItem}>
          <span aria-hidden>🔔</span>Alertas
        </div>
      </footer>
    </section>
  )

  const decision = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">¿Qué harías en esta situación?</h2>
        <p className="mt-1 text-base leading-relaxed text-body">
          El comprador envió un comprobante y el valor aparece como saldo contable, pero todavía no
          se refleja como dinero disponible confirmado.
        </p>
      </div>

      <div className="grid gap-2">
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
      </div>

      {answered && (
        <div
          className={`rounded-lg border bg-surface p-5 ${isCorrect ? 'border-success/40' : 'border-danger/40'}`}
        >
          <p className="text-base font-semibold text-ink">
            {isCorrect ? 'Correcto.' : 'Riesgo alto de estafa.'}
          </p>
          <p className="mt-2 text-base leading-relaxed text-body">
            {isCorrect
              ? 'No debes entregar el producto hasta confirmar que el dinero esté disponible. El saldo contable no significa que el pago ya sea definitivo.'
              : 'La presión, las llamadas constantes, el supuesto comprobante y el saldo contable pendiente son señales de alerta. El pago podría ser rechazado o reversado.'}
          </p>

          <div className="mt-5 rounded-md bg-canvas-soft p-4">
            <h3 className="text-sm font-semibold text-ink">Lección de seguridad</h3>
            <ul className="mt-3 grid gap-2 text-base leading-relaxed text-body">
              <li>No entregues productos si el pago solo aparece como saldo contable.</li>
              <li>Confirma que el dinero esté como saldo disponible.</li>
              <li>No confíes únicamente en capturas o recibos enviados por terceros.</li>
              <li>La presión y la urgencia son señales frecuentes de ingeniería social.</li>
              <li>Verifica directamente en la banca oficial o comunícate con tu banco.</li>
            </ul>
          </div>

          <button
            type="button"
            className="mt-5 min-h-11 w-full rounded-md bg-primary px-4 py-3 text-base font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
            onClick={handleReset}
          >
            ↻ Intentar nuevamente
          </button>
        </div>
      )}
    </div>
  )

  return (
    <EscenarioLayout
      escenarioId="estafa/saldo-contable"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      pantalla={pantalla}
      decision={decision}
      resultado={answered ? (isCorrect ? 'good' : 'bad') : undefined}
      onEmpezar={run.restart}
    />
  )
}

export default SaldoContable
