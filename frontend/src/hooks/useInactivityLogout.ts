import { useCallback, useEffect, useState } from 'react'

export const INACTIVITY_LIMIT_MS = 15 * 60 * 1000
export const INACTIVITY_WARNING_MS = 60 * 1000
const CHECK_INTERVAL_MS = 1_000
const WRITE_INTERVAL_MS = 1_000

// En localStorage y no en memoria: la actividad en una pestaña mantiene viva la
// sesión en las demás, y al reabrir el navegador se sabe cuánto tiempo pasó.
const LAST_ACTIVITY_KEY = 'mic-last-activity'

const ACTIVITY_EVENTS = [
  'pointerdown',
  'pointermove',
  'keydown',
  'input',
  'wheel',
  'touchmove',
  'scroll',
] as const

function recordActivity(): void {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
}

// Sin registro previo el plazo está completo: son sesiones abiertas antes de que
// existiera este control.
function remainingMs(): number {
  const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY))
  return last > 0 ? last + INACTIVITY_LIMIT_MS - Date.now() : INACTIVITY_LIMIT_MS
}

export function isInactivityExpired(): boolean {
  return remainingMs() <= 0
}

interface InactivityWarning {
  /** Segundos que faltan para el cierre; null mientras no toca avisar. */
  secondsLeft: number | null
  stayConnected: () => void
}

export function useInactivityLogout(enabled: boolean, onExpire: () => void): InactivityWarning {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  const check = useCallback(() => {
    const remaining = remainingMs()
    if (remaining <= 0) {
      setSecondsLeft(null)
      onExpire()
      return
    }
    setSecondsLeft(remaining <= INACTIVITY_WARNING_MS ? Math.ceil(remaining / 1000) : null)
  }, [onExpire])

  const stayConnected = useCallback(() => {
    // Un clic que llega tarde no revive la sesión ya vencida.
    if (!isInactivityExpired()) recordActivity()
    check()
  }, [check])

  useEffect(() => {
    if (!enabled) return

    recordActivity()
    let lastWrite = Date.now()

    const handleActivity = () => {
      if (Date.now() - lastWrite < WRITE_INTERVAL_MS) return
      // Primero se comprueba: al despertar un equipo suspendido, el primer
      // movimiento llega antes que el temporizador y reviviría la sesión vencida.
      // Con el aviso en pantalla solo cuenta responderlo: un roce del mouse no
      // demuestra que alguien lo haya leído.
      if (remainingMs() <= INACTIVITY_WARNING_MS) {
        check()
        return
      }
      lastWrite = Date.now()
      recordActivity()
    }

    const timer = window.setInterval(check, CHECK_INTERVAL_MS)
    // En captura: los escenarios detienen la propagación de algunos eventos, y
    // `scroll` no burbujea.
    const options = { capture: true, passive: true }
    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, handleActivity, options))
    document.addEventListener('visibilitychange', check)

    return () => {
      window.clearInterval(timer)
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, handleActivity, options))
      document.removeEventListener('visibilitychange', check)
    }
  }, [enabled, check])

  return { secondsLeft: enabled ? secondsLeft : null, stayConnected }
}
