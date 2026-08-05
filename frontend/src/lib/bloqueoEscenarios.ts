import type { Escenario } from '../data/catalogo'
import type { Progreso } from './api'

export function escenarioFueJugado(progreso: Progreso | null, escenarioId: string): boolean {
  return progreso?.escenarios.some((escenario) => {
    return escenario.id === escenarioId && escenario.ultimoOutcome !== undefined
  }) ?? false
}

export function escenarioEstaDisponible(
  escenarios: Escenario[],
  progreso: Progreso | null,
  escenarioId: string,
): boolean {
  if (!progreso) return true

  const indiceEscenario = escenarios.findIndex((escenario) => escenario.id === escenarioId)
  if (indiceEscenario === -1) return false

  const primerPendiente = escenarios.findIndex((escenario) => {
    return !escenarioFueJugado(progreso, escenario.id)
  })

  if (primerPendiente === -1) return true

  return indiceEscenario <= primerPendiente
}
