import { useCallback, useRef, useState } from 'react'
import { createRun, type RunOutcome, type RunPayload } from '../lib/api'
import { isRetryableRunError, queueRun } from '../lib/pendingRuns'
import { getScenario, type Scenario } from '../data/catalogo'

export type RunStatus = 'idle' | 'saving' | 'saved' | 'queued' | 'failed'
export type StoryKind = 'scene' | 'good' | 'partial' | 'bad'

/** Con qué cerró una corrida. Es `StoryKind` sin `'scene'`, que es el único
 *  valor que no es un final. */
export type ScenarioResult = Exclude<StoryKind, 'scene'>

export interface RunResult {
  endingId: string
  outcome: RunOutcome
  score?: number
}

export interface ScenarioRun {
  escenario: Scenario
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

// Contrato único para registrar resultados: un escenario que guarde por su
// cuenta rompe el estudio en silencio (se salta traza, versión y anti-duplicados).
export function useScenarioRun(scenarioId: string): ScenarioRun {
  const scenario = getScenario(scenarioId)

  if (!scenario) {
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
        scenarioId: scenario.id,
        version: scenario.version,
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
      } catch (error) {
        if (isRetryableRunError(error)) {
          queueRun(payload)
          setStatus('queued')
        } else {
          setStatus('failed')
        }
      }
    },
    [scenario],
  )

  const restart = useCallback(() => {
    startedAtRef.current = new Date().toISOString()
    decisionsRef.current = []
    submittedRef.current = false
    setStatus('idle')
  }, [])

  return { escenario: scenario, status, recordDecision, finish, restart }
}
