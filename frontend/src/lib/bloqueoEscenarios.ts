import type { Escenario } from '../data/catalogo'
import type { Progreso, ProgresoEscenario, RunOutcome } from './api'

// Idempotente. La corrida recién terminada se guarda en paralelo; hasta que el
// servidor la registre, el gating debe darla por hecha en vez de leer un estado viejo.
export function conEscenarioIntentado(
  progreso: Progreso,
  escenarioId: string,
  outcome: RunOutcome = 'CORRECTO',
  iniciandoRepeticion = false,
): Progreso {
  const figura = (lista: ProgresoEscenario[]) => lista.some((e) => e.id === escenarioId)
  const nuevo: ProgresoEscenario = { id: escenarioId, ultimoOutcome: outcome }

  if (progreso.rondaEnCurso) {
    if (figura(progreso.rondaEnCurso.escenarios)) return progreso
    return {
      ...progreso,
      rondaEnCurso: {
        ...progreso.rondaEnCurso,
        escenarios: [...progreso.rondaEnCurso.escenarios, nuevo],
      },
    }
  }

  // En una repetición, el GET puede devolver todavía la ronda oficial completa.
  if (figura(progreso.escenarios)) {
    if (iniciandoRepeticion) {
      return { ...progreso, rondaEnCurso: { jugados: 1, escenarios: [nuevo] } }
    }
    return progreso
  }
  return { ...progreso, escenarios: [...progreso.escenarios, nuevo] }
}

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
