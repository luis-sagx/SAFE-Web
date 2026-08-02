import { useEffect, useRef, useState } from 'react'

/**
 * Cronómetro regresivo con tick configurable (foto.js lo usaba a 0.1s).
 * Se reinicia cada vez que cambia `duration` (equivalente a startLevel()
 * reasignando timeLeft) y llama a onExpire una sola vez al llegar a 0.
 */
export function useCountdown(duration, { running = true, tickMs = 100, onExpire } = {}) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    setTimeLeft(duration)
  }, [duration])

  useEffect(() => {
    if (!running) {
      return undefined
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(prev - tickMs / 1000, 0)

        if (next === 0) {
          clearInterval(interval)
        }

        return next
      })
    }, tickMs)

    return () => clearInterval(interval)
  }, [running, tickMs])

  useEffect(() => {
    if (timeLeft === 0) {
      onExpireRef.current?.()
    }
  }, [timeLeft])

  return timeLeft
}
