import type { RunOutcomeValue } from './dto/create-run.dto';

/// Cuántos escenarios de un módulo hay que aprobar para que cuente como
/// superado. El total de escenarios NO vive aquí: lo declara el catálogo del
/// frontend, que es el único lugar donde existen de verdad (spec
/// 2026-08-03-safe-web-mvp-phishing-design.md §7.2). Este servicio nunca
/// importa el catálogo — un cliente modificado no puede aprobarse solo
/// falseando un denominador que el servidor tampoco tiene.
export const UMBRALES: Record<string, number> = {
  phishing: 6,
  smishing: 3,
};

export interface CorridaMinima {
  scenarioId: string;
  outcome: RunOutcomeValue;
  finishedAt: Date;
}

export interface ProgresoEscenario {
  id: string;
  ultimoOutcome: RunOutcomeValue;
}

export interface Progreso {
  modulo: string;
  escenarios: ProgresoEscenario[];
  aprobados: number;
  requeridos: number;
  aprobado: boolean;
}

/**
 * El último intento manda siempre, aunque baje la nota: si un participante ya
 * aprobado repite un escenario y falla, pierde ese escenario y puede bajar del
 * umbral. Es deliberado — el estado refleja lo que la persona demuestra ahora,
 * no su mejor momento.
 *
 * PARCIAL no cuenta como aprobado: en un escenario de fraude significa que
 * dudó y entregó la clave igual. Solo CORRECTO acredita.
 *
 * Un escenario sin ninguna corrida no aparece en `escenarios`: el backend no
 * conoce el catálogo, así que no puede rellenar "sin intentar" para ids que
 * nunca ve.
 */
export function calcularProgreso(
  modulo: string,
  requeridos: number,
  corridas: CorridaMinima[],
): Progreso {
  const ultimoPorEscenario = new Map<string, RunOutcomeValue>();

  // Ordenadas de más antigua a más reciente: lo último que se escribe en el
  // mapa para cada escenario es siempre su corrida más reciente, sin importar
  // en qué orden llegaron de la base ni cuántas veces se haya repetido.
  const ordenadas = [...corridas].sort(
    (a, b) => a.finishedAt.getTime() - b.finishedAt.getTime(),
  );
  for (const corrida of ordenadas) {
    ultimoPorEscenario.set(corrida.scenarioId, corrida.outcome);
  }

  const escenarios: ProgresoEscenario[] = [...ultimoPorEscenario.entries()].map(
    ([id, ultimoOutcome]) => ({ id, ultimoOutcome }),
  );

  const aprobados = escenarios.filter(
    (e) => e.ultimoOutcome === 'CORRECTO',
  ).length;

  return {
    modulo,
    escenarios,
    aprobados,
    requeridos,
    aprobado: aprobados >= requeridos,
  };
}
