import type { RunOutcomeValue } from './dto/create-run.dto';

// Umbral para aprobar cada módulo. El denominador visible en pantalla (8) vive en el
// catálogo del frontend, no aquí: este servicio nunca lo importa, para que un cliente
// modificado no pueda aprobarse falseando un denominador que el servidor no tiene.
export const THRESHOLDS: Record<string, number> = {
  phishing: 6,
  smishing: 6,
  vishing: 6,
  suplantacion: 6,
  estafa: 6,
  fisico: 6,
  'asistentes-ia': 3,
};

// A diferencia de THRESHOLDS, esto sí duplica el total del catálogo del frontend (excepción
// deliberada): obliga a "aprobado" a exigir haber jugado los 8, no solo alcanzar el umbral.
// catalogo.test.ts en el frontend cubre el riesgo de divergencia.
export const TOTALS: Record<string, number> = {
  phishing: 8,
  smishing: 8,
  vishing: 8,
  suplantacion: 8,
  estafa: 8,
  fisico: 8,
  'asistentes-ia': 4,
};

export interface MinimalRun {
  scenarioId: string;
  outcome: RunOutcomeValue;
  finishedAt: Date;
}

export interface ScenarioProgress {
  id: string;
  ultimoOutcome: RunOutcomeValue;
}

export interface Progress {
  modulo: string;
  escenarios: ScenarioProgress[];
  aprobados: number;
  requeridos: number;
  aprobado: boolean;
  ronda: number;
  rondaEnCurso: {
    jugados: number;
    escenarios: ScenarioProgress[];
  } | null;
}

// El último intento manda siempre, aunque baje la nota (deliberado): refleja lo que la
// persona demuestra ahora. `aprobado` exige alcanzar el umbral Y haber intentado todos
// los escenarios del módulo, no solo el umbral (si no, "6/8 y nunca tocó 2" aprobaba).
export function calculateProgress(
  module: string,
  required: number,
  total: number,
  runs: MinimalRun[],
): Progress {
  // Ordenadas de más antigua a más reciente: lo último que se escribe en el
  // mapa para cada escenario es siempre su corrida más reciente, sin importar
  // en qué orden llegaron de la base ni cuántas veces se haya repetido.
  const sorted = [...runs].sort(
    (a, b) => a.finishedAt.getTime() - b.finishedAt.getTime(),
  );
  const closedRounds: Map<string, RunOutcomeValue>[] = [];
  let openRound = new Map<string, RunOutcomeValue>();
  let roundIds = new Set<string>();
  for (const run of sorted) {
    roundIds.add(run.scenarioId);
    openRound.set(run.scenarioId, run.outcome);
    if (roundIds.size >= total) {
      closedRounds.push(openRound);
      openRound = new Map<string, RunOutcomeValue>();
      roundIds = new Set<string>();
    }
  }

  const officialRound = closedRounds.at(-1) ?? openRound;
  const scenarios: ScenarioProgress[] = [...officialRound.entries()].map(
    ([id, latestOutcome]) => ({ id, ultimoOutcome: latestOutcome }),
  );

  const approved = scenarios.filter(
    (e) => e.ultimoOutcome === 'CORRECTO',
  ).length;

  const openScenarios: ScenarioProgress[] = [...openRound.entries()].map(
    ([id, latestOutcome]) => ({ id, ultimoOutcome: latestOutcome }),
  );
  return {
    modulo: module,
    escenarios: scenarios,
    aprobados: approved,
    requeridos: required,
    aprobado: approved >= required && scenarios.length >= total,
    ronda: Math.max(1, closedRounds.length + (openRound.size > 0 ? 1 : 0)),
    rondaEnCurso:
      closedRounds.length > 0 && openRound.size > 0
        ? { jugados: openRound.size, escenarios: openScenarios }
        : null,
  };
}
