import { useCallback, useRef, useState } from 'react'
import { createRun, type RunOutcome, type RunPayload } from '../lib/api'
import { queueRun } from '../lib/pendingRuns'
import { getEscenario, type Escenario } from '../data/catalogo'

export type RunStatus = 'idle' | 'saving' | 'saved' | 'queued'
export type StoryKind = 'scene' | 'good' | 'partial' | 'bad'

export interface RunResult {
  endingId: string
  outcome: RunOutcome
  score?: number
}

export interface ScenarioRun {
  escenario: Escenario
  status: RunStatus
  recordDecision: (decision: Record<string, unknown>) => void
  finish: (result: RunResult) => Promise<void>
  restart: () => void
}

export function outcomeFromKind(kind: StoryKind): RunOutcome {
  if (kind === 'good') return 'CORRECTO'
  if (kind === 'partial') return 'PARCIAL'
  return 'INCORRECTO'
}

export function scoreFromOutcome(outcome: RunOutcome): number {
  if (outcome === 'CORRECTO') return 100
  if (outcome === 'PARCIAL') return 50
  return 0
}

/**
 * Contrato único para registrar el resultado de un escenario. Un escenario que
 * guarde resultados por su cuenta rompe el estudio en silencio: se salta la
 * traza, la versión y la guarda contra envíos duplicados.
 */
export function useScenarioRun(scenarioId: string): ScenarioRun {
  const escenario = getEscenario(scenarioId)

  if (!escenario) {
    throw new Error(`Escenario "${scenarioId}" no está en el catálogo.`)
  }

  const startedAtRef = useRef(new Date().toISOString())
  const decisionsRef = useRef<Record<string, unknown>[]>([])
  const submittedRef = useRef(false)
  const [status, setStatus] = useState<RunStatus>('idle')

  const recordDecision = useCallback((decision: Record<string, unknown>) => {
    decisionsRef.current.push({ ...decision, at: new Date().toISOString() })
  }, [])

  const finish = useCallback(
    async ({ endingId, outcome, score }: RunResult) => {
      // StrictMode ejecuta los efectos dos veces y el participante puede llegar
      // al mismo final por varios caminos: sin esta guarda se duplican filas.
      if (submittedRef.current) {
        return
      }
      submittedRef.current = true

      const payload: RunPayload = {
        scenarioId: escenario.id,
        version: escenario.version,
        outcome,
        score: score ?? scoreFromOutcome(outcome),
        endingId,
        durationMs: Date.now() - Date.parse(startedAtRef.current),
        startedAt: startedAtRef.current,
        decisions: decisionsRef.current,
      }

      setStatus('saving')

      try {
        await createRun(payload)
        setStatus('saved')
      } catch {
        queueRun(payload)
        setStatus('queued')
      }
    },
    [escenario],
  )

  const restart = useCallback(() => {
    startedAtRef.current = new Date().toISOString()
    decisionsRef.current = []
    submittedRef.current = false
    setStatus('idle')
  }, [])

  return { escenario, status, recordDecision, finish, restart }
}
