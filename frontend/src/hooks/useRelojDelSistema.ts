import { useEffect, useState } from 'react'

// Se refresca cada 15s (no cada segundo) porque solo se muestran horas y
// minutos: basta para verlos cambiar sin re-renderizar 60 veces por minuto.
export function useSystemClock(): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000)
    return () => clearInterval(id)
  }, [])

  return now
}

// 24 horas, como los relojes de sistema en Ecuador.
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}
