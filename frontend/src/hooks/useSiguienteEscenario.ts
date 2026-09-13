import { useEffect, useState } from 'react'
import { getSectionScenarios, getScenarioPath } from '../data/catalogo'
import { fetchProgress } from '../lib/api'
import { withAttemptedScenario, nextInRound } from '../lib/bloqueoEscenarios'

interface NextScenarioResult {
  ruta: string | null
  cargando: boolean
}

export function useNextScenario(scenarioId: string): NextScenarioResult {
  const [path, setPath] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sectionId = scenarioId.split('/')[0] ?? ''
    const scenarios = getSectionScenarios(sectionId)

    if (scenarios.length === 0) {
      setLoading(false)
      return
    }

    let cancelled = false

    fetchProgress(sectionId)
      .then((progress) => {
        if (cancelled) return

        const next = nextInRound(
          scenarios,
          withAttemptedScenario(progress, scenarioId),
        )

        if (next) {
          setPath(getScenarioPath(next))
        } else {
          setPath(`/seccion/${sectionId}`)
        }
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return

        const next = scenarios[scenarios.findIndex((e) => e.id === scenarioId) + 1]
        if (next) {
          setPath(getScenarioPath(next))
        } else {
          setPath(`/seccion/${sectionId}`)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [scenarioId])

  return { ruta: path, cargando: loading }
}
