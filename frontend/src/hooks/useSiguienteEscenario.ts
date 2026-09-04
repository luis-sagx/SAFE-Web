import { useEffect, useState } from 'react'
import { escenariosDeSeccion } from '../data/catalogo'
import { fetchProgreso } from '../lib/api'

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
    const indiceActual = escenarios.findIndex((e) => e.id === escenarioId)

    if (escenarios.length === 0) {
      setCargando(false)
      return
    }

    let cancelado = false

    fetchProgreso(seccionId)
      .then((progreso) => {
        if (cancelado) return

        const intentados = new Set([...progreso.escenarios.map((e) => e.id), escenarioId])
        const siguiente = escenarios.find((e) => !intentados.has(e.id))

        if (siguiente) {
          setRuta(`/seccion/${siguiente.seccionId}/${siguiente.escenarioId}`)
        } else {
          setRuta(`/seccion/${seccionId}`)
        }
        setCargando(false)
      })
      .catch(() => {
        if (cancelado) return

        const siguiente = escenarios[indiceActual + 1]
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
