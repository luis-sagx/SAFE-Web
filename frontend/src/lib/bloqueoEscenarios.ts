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
  opciones: { iniciandoRepeticion?: boolean } = {},
): boolean {
  if (!progreso) return true

  const indiceEscenario = escenarios.findIndex((escenario) => escenario.id === escenarioId)
  if (indiceEscenario === -1) return false

  const enRepeticion = progreso.rondaEnCurso != null
  const reposo = !enRepeticion && progreso.escenarios.length >= escenarios.length
  if (reposo) return opciones.iniciandoRepeticion === true && indiceEscenario === 0
  const jugados = enRepeticion ? progreso.rondaEnCurso!.escenarios : progreso.escenarios
  const ids = new Set(jugados.map((e) => e.id))
  return !ids.has(escenarioId) && escenarios.find((e) => !ids.has(e.id))?.id === escenarioId
}

export function siguienteEnRonda(escenarios: Escenario[], progreso: Progreso | null): Escenario | null {
  if (!progreso) return escenarios[0] ?? null
  const enRepeticion = progreso.rondaEnCurso != null
  const reposo = !enRepeticion && progreso.escenarios.length >= escenarios.length
  if (reposo) return null
  const jugados = enRepeticion ? progreso.rondaEnCurso!.escenarios : progreso.escenarios
  const ids = new Set(jugados.map((e) => e.id))
  return escenarios.find((e) => !ids.has(e.id)) ?? null
}
