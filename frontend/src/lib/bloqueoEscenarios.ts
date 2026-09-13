import type { Scenario } from '../data/catalogo'
import type { Progress, ScenarioProgress, RunOutcome } from './api'

// Idempotente. La corrida recién terminada se guarda en paralelo; hasta que el
// servidor la registre, el gating debe darla por hecha en vez de leer un estado viejo.
export function withAttemptedScenario(
  progress: Progress,
  scenarioId: string,
  outcome: RunOutcome = 'CORRECTO',
  startingReplay = false,
): Progress {
  const figure = (list: ScenarioProgress[]) => list.some((e) => e.id === scenarioId)
  const newScenario: ScenarioProgress = { id: scenarioId, ultimoOutcome: outcome }

  if (progress.rondaEnCurso) {
    if (figure(progress.rondaEnCurso.escenarios)) return progress
    return {
      ...progress,
      rondaEnCurso: {
        ...progress.rondaEnCurso,
        escenarios: [...progress.rondaEnCurso.escenarios, newScenario],
      },
    }
  }

  // En una repetición, el GET puede devolver todavía la ronda oficial completa.
  if (figure(progress.escenarios)) {
    if (startingReplay) {
      return { ...progress, rondaEnCurso: { jugados: 1, escenarios: [newScenario] } }
    }
    return progress
  }
  return { ...progress, escenarios: [...progress.escenarios, newScenario] }
}

export function wasScenarioPlayed(progress: Progress | null, scenarioId: string): boolean {
  return progress?.escenarios.some((scenario) => {
    return scenario.id === scenarioId && scenario.ultimoOutcome !== undefined
  }) ?? false
}

export function isScenarioAvailable(
  scenarios: Scenario[],
  progress: Progress | null,
  scenarioId: string,
  options: { iniciandoRepeticion?: boolean } = {},
): boolean {
  if (!progress) return true

  const scenarioIndex = scenarios.findIndex((scenario) => scenario.id === scenarioId)
  if (scenarioIndex === -1) return false

  const replaying = progress.rondaEnCurso != null
  const rest = !replaying && progress.escenarios.length >= scenarios.length
  if (rest) return options.iniciandoRepeticion === true && scenarioIndex === 0
  const played = replaying ? progress.rondaEnCurso!.escenarios : progress.escenarios
  const ids = new Set(played.map((e) => e.id))
  return !ids.has(scenarioId) && scenarios.find((e) => !ids.has(e.id))?.id === scenarioId
}

export function nextInRound(scenarios: Scenario[], progress: Progress | null): Scenario | null {
  if (!progress) return scenarios[0] ?? null
  const replaying = progress.rondaEnCurso != null
  const rest = !replaying && progress.escenarios.length >= scenarios.length
  if (rest) return null
  const played = replaying ? progress.rondaEnCurso!.escenarios : progress.escenarios
  const ids = new Set(played.map((e) => e.id))
  return scenarios.find((e) => !ids.has(e.id)) ?? null
}
