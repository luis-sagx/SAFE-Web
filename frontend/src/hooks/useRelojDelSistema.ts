import { useEffect, useState } from 'react'

// Se refresca cada 15s (no cada segundo) porque solo se muestran horas y
// minutos: basta para verlos cambiar sin re-renderizar 60 veces por minuto.
export function useRelojDelSistema(): Date {
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 15_000)
    return () => clearInterval(id)
  }, [])

  return ahora
}

// 24 horas, como los relojes de sistema en Ecuador.
export function formatoHora(fecha: Date): string {
  return fecha.toLocaleTimeString('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatoFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}
