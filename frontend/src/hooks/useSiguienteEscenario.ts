import { useEffect, useState } from 'react'
import { escenariosDeSeccion } from '../data/catalogo'
import { fetchProgreso } from '../lib/api'
import { conEscenarioIntentado, siguienteEnRonda } from '../lib/bloqueoEscenarios'

interface SiguienteEscenarioResult {
  ruta: string | null
  cargando: boolean
}

export function useSiguienteEscenario(escenarioId: string): SiguienteEscenarioResult {
  const [ruta, setRuta] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const seccionId = escenarioId.split('/')[0] ?? ''
    const escenarios = escenariosDeSeccion(seccionId)

    if (escenarios.length === 0) {
      setCargando(false)
      return
    }

    let cancelado = false

    fetchProgreso(seccionId)
      .then((progreso) => {
        if (cancelado) return

        const siguiente = siguienteEnRonda(escenarios, conEscenarioIntentado(progreso, escenarioId))

        if (siguiente) {
          setRuta(`/seccion/${siguiente.seccionId}/${siguiente.escenarioId}`)
        } else {
          setRuta(`/seccion/${seccionId}`)
        }
        setCargando(false)
      })
      .catch(() => {
        if (cancelado) return

        const siguiente = escenarios[escenarios.findIndex((e) => e.id === escenarioId) + 1]
        if (siguiente) {
          setRuta(`/seccion/${siguiente.seccionId}/${siguiente.escenarioId}`)
        } else {
          setRuta(`/seccion/${seccionId}`)
        }
        setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [escenarioId])

  return { ruta, cargando }
}
