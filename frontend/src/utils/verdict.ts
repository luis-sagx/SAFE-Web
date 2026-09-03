export type ScenarioLevel = 'safe' | 'warn' | 'danger'

export function verdictForLevel(level: ScenarioLevel): string {
  switch (level) {
    case 'safe':
      return 'Decisión segura'
    case 'warn':
      return 'Observación'
    case 'danger':
      return 'Riesgo detectado'
  }
}

export function stampForLevel(level: ScenarioLevel): string {
  switch (level) {
    case 'safe':
      return 'APROBADO'
    case 'warn':
      return 'OBSERVACIÓN'
    case 'danger':
      return 'RIESGO'
  }
}

export function pinForLevel(level: ScenarioLevel): string {
  switch (level) {
    case 'safe':
      return '✓'
    case 'warn':
      return '!'
    case 'danger':
      return '✕'
  }
}

export function outcomeForLevel(level: ScenarioLevel): 'CORRECTO' | 'PARCIAL' | 'INCORRECTO' {
  switch (level) {
    case 'safe':
      return 'CORRECTO'
    case 'warn':
      return 'PARCIAL'
    case 'danger':
      return 'INCORRECTO'
  }
}
