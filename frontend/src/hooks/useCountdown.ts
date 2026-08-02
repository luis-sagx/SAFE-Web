import { useEffect, useRef, useState } from 'react'

interface CountdownOptions {
  running?: boolean
  tickMs?: number
  onExpire?: () => void
}

// Se reinicia cuando cambia `duration` y llama a onExpire una sola vez al
// llegar a 0.
export function useCountdown(
  duration: number,
  { running = true, tickMs = 100, onExpire }: CountdownOptions = {},
): number {
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
