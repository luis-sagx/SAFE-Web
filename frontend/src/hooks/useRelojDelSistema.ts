import { useEffect, useState } from 'react'

/**
 * La hora real del equipo, avanzando sola.
 *
 * Es lo que hace que la ventana simulada se lea como el computador de quien
 * está jugando y no como una captura: un reloj congelado en una hora inventada
 * es de las primeras cosas que delatan que la pantalla es de mentira.
 *
 * Se refresca cada 15 segundos y no cada segundo porque solo se muestran horas
 * y minutos: bastan cuatro comprobaciones por minuto para que el cambio de
 * minuto se vea al instante, sin re-renderizar la pantalla 60 veces.
 */
export function useRelojDelSistema(): Date {
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 15_000)
    return () => clearInterval(id)
  }, [])

  return ahora
}

/** 24 horas, como los relojes de sistema en Ecuador. */
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
