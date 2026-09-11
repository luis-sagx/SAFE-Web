import type { RunOutcomeValue } from './dto/create-run.dto';

// Umbral para aprobar cada módulo. El denominador visible en pantalla (8) vive en el
// catálogo del frontend, no aquí: este servicio nunca lo importa, para que un cliente
// modificado no pueda aprobarse falseando un denominador que el servidor no tiene.
export const UMBRALES: Record<string, number> = {
  phishing: 6,
  smishing: 6,
  vishing: 6,
  suplantacion: 6,
  estafa: 6,
  fisico: 6,
  'asistentes-ia': 3,
};

// A diferencia de UMBRALES, esto sí duplica el total del catálogo del frontend (excepción
// deliberada): obliga a "aprobado" a exigir haber jugado los 8, no solo alcanzar el umbral.
// catalogo.test.ts en el frontend cubre el riesgo de divergencia.
export const TOTALES: Record<string, number> = {
  phishing: 8,
  smishing: 8,
  vishing: 8,
  suplantacion: 8,
  estafa: 8,
  fisico: 8,
  'asistentes-ia': 4,
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
  ronda: number;
  rondaEnCurso: {
    jugados: number;
    escenarios: ProgresoEscenario[];
  } | null;
}

// El último intento manda siempre, aunque baje la nota (deliberado): refleja lo que la
// persona demuestra ahora. `aprobado` exige alcanzar el umbral Y haber intentado todos
// los escenarios del módulo, no solo el umbral (si no, "6/8 y nunca tocó 2" aprobaba).
export function calcularProgreso(
  modulo: string,
  requeridos: number,
  total: number,
  corridas: CorridaMinima[],
): Progreso {
  // Ordenadas de más antigua a más reciente: lo último que se escribe en el
  // mapa para cada escenario es siempre su corrida más reciente, sin importar
  // en qué orden llegaron de la base ni cuántas veces se haya repetido.
  const ordenadas = [...corridas].sort(
    (a, b) => a.finishedAt.getTime() - b.finishedAt.getTime(),
  );
  const rondasCerradas: Map<string, RunOutcomeValue>[] = [];
  let rondaAbierta = new Map<string, RunOutcomeValue>();
  let idsRonda = new Set<string>();
  for (const corrida of ordenadas) {
    idsRonda.add(corrida.scenarioId);
    rondaAbierta.set(corrida.scenarioId, corrida.outcome);
    if (idsRonda.size >= total) {
      rondasCerradas.push(rondaAbierta);
      rondaAbierta = new Map<string, RunOutcomeValue>();
      idsRonda = new Set<string>();
    }
  }

  const rondaOficial = rondasCerradas.at(-1) ?? rondaAbierta;
  const escenarios: ProgresoEscenario[] = [...rondaOficial.entries()].map(
    ([id, ultimoOutcome]) => ({ id, ultimoOutcome }),
  );

  const aprobados = escenarios.filter(
    (e) => e.ultimoOutcome === 'CORRECTO',
  ).length;

  const escenariosAbiertos: ProgresoEscenario[] = [
    ...rondaAbierta.entries(),
  ].map(([id, ultimoOutcome]) => ({ id, ultimoOutcome }));
  return {
    modulo,
    escenarios,
    aprobados,
    requeridos,
    aprobado: aprobados >= requeridos && escenarios.length >= total,
    ronda: Math.max(1, rondasCerradas.length + (rondaAbierta.size > 0 ? 1 : 0)),
    rondaEnCurso:
      rondasCerradas.length > 0 && rondaAbierta.size > 0
        ? { jugados: rondaAbierta.size, escenarios: escenariosAbiertos }
        : null,
  };
}
